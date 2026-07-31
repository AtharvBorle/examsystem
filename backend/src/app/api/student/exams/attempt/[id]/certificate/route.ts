import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth-middleware'
import { translateClassroomName } from '@/lib/class-translator'
import { upsertSchoolTranslation } from '@/lib/school-translator'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const attemptId = params.id
    if (!attemptId) {
      return errorResponse('Attempt ID is required', 400)
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          select: { name: true, nameHindi: true, createdAt: true, questionCount: true, marksPerQuestion: true },
        },
        student: {
          select: {
            id: true,
            name: true,
            district: true,
            tehsil: true,
            school: {
              select: {
                id: true,
                name: true,
                udise: true,
                language: true,
                district: true,
                tehsil: true,
                admin: {
                  select: {
                    branch: true,
                    branchHindi: true,
                    presidentName: true,
                    presidentNameHindi: true,
                    presidentSignature: true,
                    secretaryName: true,
                    secretaryNameHindi: true,
                    secretarySignature: true,
                  }
                }
              },
            },
            classroom: { select: { name: true } },
          },
        },
      },
    })

    if (!attempt) {
      return errorResponse('Exam attempt not found', 404)
    }

    // Security check: Student can only view their own certificate
    if (user.role === 'STUDENT' && attempt.studentId !== user.userId) {
      return errorResponse('Unauthorized. Access denied.', 403)
    }

    if (!attempt.completed) {
      return errorResponse('Certificate is not available yet. The exam is not completed.', 400)
    }

    const currentSchool = attempt.student.school
    let schoolName = currentSchool.name
    let district = currentSchool.district || attempt.student.district || ''
    let tehsil = currentSchool.tehsil || attempt.student.tehsil || ''

    const { searchParams } = new URL(req.url)
    const queryLang = searchParams.get('lang')
    const targetLang = queryLang || attempt.language || 'en'

    if (targetLang !== currentSchool.language) {
      const targetSchool = await prisma.school.findFirst({
        where: {
          udise: currentSchool.udise,
          language: targetLang,
        },
      })
      if (targetSchool) {
        schoolName = targetSchool.name
        if (targetSchool.district) district = targetSchool.district
        if (targetSchool.tehsil) tehsil = targetSchool.tehsil
      }
    }

    const GEOGRAPHY_MAP: { [key: string]: { en: string; hi: string } } = {
      amravati: { en: 'Amravati', hi: 'अमरावती' },
      latur: { en: 'Latur', hi: 'लातूर' },
      pune: { en: 'Pune', hi: 'पुणे' },
      mumbai: { en: 'Mumbai', hi: 'मुंबई' },
      nagpur: { en: 'Nagpur', hi: 'नागपुर' },
      snagpur: { en: 'Nagpur', hi: 'नागपुर' },
      nashik: { en: 'Nashik', hi: 'नाशिक' },
      thane: { en: 'Thane', hi: 'ठाणे' },
      aurangabad: { en: 'Aurangabad', hi: 'औरंगाबाद' },
      'chhatrapati sambhajinagar': { en: 'Chhatrapati Sambhajinagar', hi: 'छत्रपति संभाजीनगर' },
      solapur: { en: 'Solapur', hi: 'सोलापुर' },
      kolhapur: { en: 'Kolhapur', hi: 'कोल्हापुर' },
      jalgaon: { en: 'Jalgaon', hi: 'जलगांव' },
      nanded: { en: 'Nanded', hi: 'नांदेड' },
      satara: { en: 'Satara', hi: 'सतारा' },
      sangli: { en: 'Sangli', hi: 'सांगली' },
      akola: { en: 'Akola', hi: 'अकोला' },
      yavatmal: { en: 'Yavatmal', hi: 'यवतमाल' },
      buldhana: { en: 'Buldhana', hi: 'बुलढाणा' },
      washim: { en: 'Washim', hi: 'वाशिम' },
      wardha: { en: 'Wardha', hi: 'वर्धा' },
      bhandara: { en: 'Bhandara', hi: 'भंडारा' },
      gondia: { en: 'Gondia', hi: 'गोंदिया' },
      chandrapur: { en: 'Chandrapur', hi: 'चंद्रपुर' },
      gadchiroli: { en: 'Gadchiroli', hi: 'गडचिरोली' },
      osmanabad: { en: 'Osmanabad', hi: 'उस्मानाबाद' },
      dharashiv: { en: 'Dharashiv', hi: 'धाराशिव' },
      beed: { en: 'Beed', hi: 'बीड' },
      jalna: { en: 'Jalna', hi: 'जालना' },
      parbhani: { en: 'Parbhani', hi: 'परभणी' },
      hingoli: { en: 'Hingoli', hi: 'हिंगोली' },
      ahmednagar: { en: 'Ahmednagar', hi: 'अहमदनगर' },
      dhule: { en: 'Dhule', hi: 'धुले' },
      nandurbar: { en: 'Nandurbar', hi: 'नंदुरबार' },
      ratnagiri: { en: 'Ratnagiri', hi: 'रत्नागिरी' },
      sindhudurg: { en: 'Sindhudurg', hi: 'सिंधुदुर्ग' },
      raigad: { en: 'Raigad', hi: 'रायगढ़' },
      palghar: { en: 'Palghar', hi: 'पालघर' },
    }

    const translateGeography = (val: string, lang: string): string => {
      if (!val) return ''
      const cleaned = val.trim().toLowerCase()
      const toHindi = lang === 'hi'
      if (GEOGRAPHY_MAP[cleaned]) {
        return toHindi ? GEOGRAPHY_MAP[cleaned].hi : GEOGRAPHY_MAP[cleaned].en
      }
      for (const item of Object.values(GEOGRAPHY_MAP)) {
        if (item.hi.toLowerCase() === cleaned || item.en.toLowerCase() === cleaned) {
          return toHindi ? item.hi : item.en
        }
      }
      return val
    }

    const classroomName = translateClassroomName(attempt.student.classroom.name, targetLang)

    return successResponse({
      certificate: {
        attemptId: attempt.id,
        studentName: attempt.student.name,
        schoolName,
        classroomName,
        examName: (targetLang === 'hi' && attempt.exam.nameHindi) ? attempt.exam.nameHindi : attempt.exam.name,
        completedAt: attempt.exam.createdAt || attempt.submittedAt,
        language: targetLang,
        score: attempt.score,
        totalMarks: attempt.exam.questionCount * attempt.exam.marksPerQuestion,
        district: translateGeography(district, targetLang),
        tehsil: translateGeography(tehsil, targetLang),
        branch: (targetLang === 'hi' && attempt.student.school.admin.branchHindi)
          ? attempt.student.school.admin.branchHindi
          : (attempt.student.school.admin.branch || ''),
        presidentName: (targetLang === 'hi' && attempt.student.school.admin.presidentNameHindi)
          ? attempt.student.school.admin.presidentNameHindi
          : (attempt.student.school.admin.presidentName || ''),
        presidentSignature: (attempt.student.school.admin.presidentSignature || '').startsWith('/uploads/') 
          ? (attempt.student.school.admin.presidentSignature || '').replace('/uploads/', '/api/uploads/') 
          : (attempt.student.school.admin.presidentSignature || ''),
        secretaryName: (targetLang === 'hi' && attempt.student.school.admin.secretaryNameHindi)
          ? attempt.student.school.admin.secretaryNameHindi
          : (attempt.student.school.admin.secretaryName || ''),
        secretarySignature: (attempt.student.school.admin.secretarySignature || '').startsWith('/uploads/') 
          ? (attempt.student.school.admin.secretarySignature || '').replace('/uploads/', '/api/uploads/') 
          : (attempt.student.school.admin.secretarySignature || ''),
      },
    })
  } catch (error: any) {
    console.error('Fetch certificate info error:', error)
    return errorResponse('Internal server error', 500)
  }
}
