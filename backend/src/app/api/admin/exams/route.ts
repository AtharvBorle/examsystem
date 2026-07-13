import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'

import { translateCategoryName } from '@/lib/category-translator'

// GET /api/admin/exams - List all exams
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const language = searchParams.get('language') || 'en'

    const exams = await prisma.exam.findMany({
      where: { adminId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        schools: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        groups: { include: { group: { select: { name: true } } } },
        _count: { select: { questions: true, attempts: true } },
      },
    })

    const formatted = exams.map((exam) => ({
      id: exam.id,
      name: exam.name,
      nameHindi: exam.nameHindi || '',
      categoryName: translateCategoryName(exam.category.name, language),
      subcategoryName: exam.subcategory?.name ? translateCategoryName(exam.subcategory.name, language) : null,
      duration: exam.duration,
      questionCount: exam.questionCount,
      marksPerQuestion: exam.marksPerQuestion,
      totalPoolQuestions: exam._count.questions,
      totalAttempts: exam._count.attempts,
      schools: exam.schools.map((s) => s.school.name),
      groups: exam.groups.map((g) => g.group.name),
      questionSetName: exam.questionSetName,
      createdAt: exam.createdAt,
    }))

    return successResponse({ exams: formatted })
  } catch (error: any) {
    console.error('List exams error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/admin/exams - Create a new exam
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const {
      name,
      nameHindi,
      categoryId,
      subcategoryId,
      duration,
      questionCount,
      marksPerQuestion,
      schoolIds,
      groupIds,
      questionIds,
      questionSetName,
    } = await req.json()

    if (!name || !categoryId || !duration || !questionCount || !marksPerQuestion) {
      return errorResponse('Missing required fields for exam creation', 400)
    }
    if (!Array.isArray(schoolIds) || schoolIds.length === 0) {
      return errorResponse('At least one school must be selected to push the exam to', 400)
    }
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return errorResponse('At least one group must be targeted by the exam', 400)
    }

    // Determine question pool
    // Admin can either pass explicit questionIds or we select all questions belonging to category/subcategory uploaded by this admin
    let targetQuestionIds: string[] = []
    if (Array.isArray(questionIds) && questionIds.length > 0) {
      targetQuestionIds = questionIds
        } else {
      const qWhere: any = {
        categoryId,
        subcategoryId: subcategoryId || null,
        adminId: user.userId,
      }
      if (questionSetName) {
        qWhere.questionSetName = questionSetName
      }
      const dbQuestions = await prisma.questionMaster.findMany({
        where: qWhere,
        select: { id: true },
      })
      targetQuestionIds = dbQuestions.map((q) => q.id)
    }

    if (targetQuestionIds.length < questionCount) {
      return errorResponse(
        `Insufficient questions in pool. The exam requires ${questionCount} questions, but the selected pool only has ${targetQuestionIds.length} questions.`,
        400
      )
    }

    const exam = await prisma.$transaction(async (tx) => {
      const e = await tx.exam.create({
        data: {
          name,
          nameHindi: nameHindi || null,
          categoryId,
          subcategoryId: subcategoryId || null,
          duration: parseInt(duration),
          questionCount: parseInt(questionCount),
          marksPerQuestion: parseFloat(marksPerQuestion),
          adminId: user.userId,
          questionSetName: questionSetName || null,
        },
      })

            // Link Schools
      if (schoolIds.length > 0) {
        await tx.schoolExam.createMany({
          data: schoolIds.map((sId) => ({
            schoolId: sId,
            examId: e.id,
          })),
        })
      }

      // Link Groups
      if (groupIds.length > 0) {
        await tx.examGroup.createMany({
          data: groupIds.map((gId) => ({
            groupId: gId,
            examId: e.id,
          })),
        })
      }

      // Link Questions
      if (targetQuestionIds.length > 0) {
        await tx.examQuestion.createMany({
          data: targetQuestionIds.map((qId) => ({
            questionMasterId: qId,
            examId: e.id,
          })),
        })
      }

      return e
        })

    return successResponse({ exam })
  } catch (error: any) {
    console.error('Create exam error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/admin/exams - Edit exam details and scope mappings
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const body = await req.json()
    const {
      id,
      name,
      nameHindi,
      categoryId,
      subcategoryId,
      duration,
      questionCount,
      marksPerQuestion,
      schoolIds,
      groupIds,
      questionSetName,
    } = body

    if (!id || !name || !categoryId || !duration || !questionCount || !marksPerQuestion) {
      return errorResponse('Missing required fields for exam update', 400)
    }

    // Verify ownership
    const exam = await prisma.exam.findUnique({ where: { id } })
    if (!exam || exam.adminId !== user.userId) {
      return errorResponse('Exam not found or unauthorized', 404)
    }

        // Query questions pool for target category/subcategory
    const qWhere: any = {
      categoryId,
      subcategoryId: subcategoryId || null,
      adminId: user.userId,
    }
    if (questionSetName) {
      qWhere.questionSetName = questionSetName
    }
    const dbQuestions = await prisma.questionMaster.findMany({
      where: qWhere,
      select: { id: true },
    })
    const targetQuestionIds = dbQuestions.map((q) => q.id)

    if (targetQuestionIds.length < questionCount) {
      return errorResponse(
        `Insufficient questions in pool. The exam requires ${questionCount} questions, but the selected pool only has ${targetQuestionIds.length} questions.`,
        400
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Exam record
      const e = await tx.exam.update({
        where: { id },
        data: {
          name,
          nameHindi: nameHindi || null,
          categoryId,
          subcategoryId: subcategoryId || null,
          duration: parseInt(duration),
          questionCount: parseInt(questionCount),
          marksPerQuestion: parseFloat(marksPerQuestion),
          questionSetName: questionSetName || null,
        },
      })

      // 2. Sync School links
      await tx.schoolExam.deleteMany({ where: { examId: id } })
      if (Array.isArray(schoolIds) && schoolIds.length > 0) {
        await tx.schoolExam.createMany({
          data: schoolIds.map((sId) => ({
            schoolId: sId,
            examId: id,
          })),
        })
      }

      // 3. Sync Group links
      await tx.examGroup.deleteMany({ where: { examId: id } })
      if (Array.isArray(groupIds) && groupIds.length > 0) {
        await tx.examGroup.createMany({
          data: groupIds.map((gId) => ({
            groupId: gId,
            examId: id,
          })),
        })
      }

      // 4. Sync Question links
      await tx.examQuestion.deleteMany({ where: { examId: id } })
      if (targetQuestionIds.length > 0) {
        await tx.examQuestion.createMany({
          data: targetQuestionIds.map((qId) => ({
            questionMasterId: qId,
            examId: id,
          })),
        })
      }

      return e
    })

    return successResponse({ exam: updated })
  } catch (error: any) {
    console.error('Update exam error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/admin/exams - Delete an exam and all links cascadingly
export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const idsStr = searchParams.get('ids')

    if (!id && !idsStr) {
      return errorResponse('Missing parameter: id or ids is required', 400)
    }

    if (id) {
      // Verify ownership
      const exam = await prisma.exam.findUnique({ where: { id } })
      if (!exam || exam.adminId !== user.userId) {
        return errorResponse('Exam not found or unauthorized', 404)
      }

      await prisma.$transaction([
        prisma.examAttempt.deleteMany({ where: { examId: id } }),
        prisma.schoolExam.deleteMany({ where: { examId: id } }),
        prisma.examGroup.deleteMany({ where: { examId: id } }),
        prisma.examQuestion.deleteMany({ where: { examId: id } }),
        prisma.exam.delete({ where: { id } })
      ])

      return successResponse({ success: true, message: 'Exam and all associated attempts deleted successfully' })
    }

    if (idsStr) {
      const targetIds = idsStr.split(',').filter(Boolean)
      const ownedExams = await prisma.exam.findMany({
        where: { id: { in: targetIds }, adminId: user.userId },
        select: { id: true }
      })
      const ownedIds = ownedExams.map(e => e.id)

      if (ownedIds.length === 0) {
        return errorResponse('No matching exams found for deletion', 400)
      }

      await prisma.$transaction([
        prisma.examAttempt.deleteMany({ where: { examId: { in: ownedIds } } }),
        prisma.schoolExam.deleteMany({ where: { examId: { in: ownedIds } } }),
        prisma.examGroup.deleteMany({ where: { examId: { in: ownedIds } } }),
        prisma.examQuestion.deleteMany({ where: { examId: { in: ownedIds } } }),
        prisma.exam.deleteMany({ where: { id: { in: ownedIds } } })
      ])

      return successResponse({ success: true, message: `${ownedIds.length} exams and all associated attempts deleted successfully` })
    }

    return errorResponse('Bad request', 400)
  } catch (error: any) {
    console.error('Delete exam error:', error)
    return errorResponse('Internal server error', 500)
  }
}
