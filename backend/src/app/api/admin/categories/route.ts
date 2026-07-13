import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { translateCategoryName } from '@/lib/category-translator'

// GET /api/admin/categories - List all categories with their subcategories
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const language = searchParams.get('language') || 'en'

    const categories = await prisma.category.findMany({
      where: { adminId: user.userId },
      orderBy: { name: 'asc' },
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
      },
    })

    const translatedCategories = categories.map((cat) => ({
      ...cat,
      name: translateCategoryName(cat.name, language),
      subcategories: cat.subcategories.map((sub) => ({
        ...sub,
        name: translateCategoryName(sub.name, language),
      })),
    }))

    return successResponse({ categories: translatedCategories })
  } catch (error: any) {
    console.error('List categories error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/admin/categories - Create category and subcategories
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { name, subcategories } = await req.json()

    if (!name) {
      return errorResponse('Category name is required', 400)
    }

    const category = await prisma.$transaction(async (tx) => {
      // Find or create category
      let cat = await tx.category.findFirst({
        where: { name, adminId: user.userId },
      })
      if (!cat) {
        cat = await tx.category.create({
          data: { name, adminId: user.userId },
        })
      }

      // Add subcategories
      if (Array.isArray(subcategories) && subcategories.length > 0) {
        for (const subName of subcategories) {
          if (!subName) continue
          const exists = await tx.subcategory.findFirst({
            where: { name: subName, categoryId: cat.id },
          })
          if (!exists) {
            await tx.subcategory.create({
              data: { name: subName, categoryId: cat.id },
            })
          }
        }
      }

      return tx.category.findUnique({
        where: { id: cat.id },
        include: { subcategories: true },
      })
    })

        return successResponse({ category })
  } catch (error: any) {
    console.error('Create category error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/admin/categories - Edit category name and/or subcategories
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { id, name, subcategories } = await req.json()
    if (!id) {
      return errorResponse('Category id is required', 400)
    }

    // Verify ownership
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing || existing.adminId !== user.userId) {
      return errorResponse('Category not found or unauthorized', 404)
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update name if provided
      if (name && name.trim()) {
        await tx.category.update({
          where: { id },
          data: { name: name.trim() },
        })
      }

      // Sync subcategories if provided
      if (Array.isArray(subcategories)) {
        // Get existing subcategories
        const existingSubs = await tx.subcategory.findMany({
          where: { categoryId: id },
        })
        const existingNames = new Set(existingSubs.map(s => s.name))
        const targetNames = new Set(subcategories.filter((n: string) => n && n.trim()).map((n: string) => n.trim()))

        // Delete subcategories not in new list (only if they have no questions)
        for (const sub of existingSubs) {
          if (!targetNames.has(sub.name)) {
            const qCount = await tx.questionMaster.count({ where: { subcategoryId: sub.id } })
            if (qCount === 0) {
              await tx.subcategory.delete({ where: { id: sub.id } })
            }
          }
        }

        // Add new subcategories
        for (const subName of targetNames) {
          if (!existingNames.has(subName)) {
            await tx.subcategory.create({
              data: { name: subName, categoryId: id },
            })
          }
        }
      }

      return tx.category.findUnique({
        where: { id },
        include: { subcategories: { orderBy: { name: 'asc' } } },
      })
    }, { timeout: 15000 })

    return successResponse({ category: updated })
  } catch (error: any) {
    console.error('Update category error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/admin/categories - Delete a category
export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Unauthorized. Admin access required.', 401)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('Missing parameter: id is required', 400)
    }

    // Verify ownership
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing || existing.adminId !== user.userId) {
      return errorResponse('Category not found or unauthorized', 404)
    }

    // Check for linked exams
    const examCount = await prisma.exam.count({ where: { categoryId: id } })
    if (examCount > 0) {
      return errorResponse(`Cannot delete category. It is linked to ${examCount} exam(s). Remove or reassign the exams first.`, 400)
    }

    // Check for questions
    const questionCount = await prisma.questionMaster.count({ where: { categoryId: id } })
    if (questionCount > 0) {
      return errorResponse(`Cannot delete category. It has ${questionCount} question(s). Delete the questions first.`, 400)
    }

    // Delete subcategories first, then category
    await prisma.$transaction(async (tx) => {
      await tx.subcategory.deleteMany({ where: { categoryId: id } })
      await tx.category.delete({ where: { id } })
    })

    return successResponse({ message: 'Category deleted successfully' })
  } catch (error: any) {
    console.error('Delete category error:', error)
    return errorResponse('Internal server error', 500)
  }
}

