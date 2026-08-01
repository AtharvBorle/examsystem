import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== STUDENTS ===')
  const students = await prisma.student.findMany({
    include: {
      school: { select: { name: true } },
      classroom: { select: { name: true } }
    }
  })
  students.forEach((s) => {
    console.log(`Student ID: ${s.id}`)
    console.log(`Name: ${s.name}`)
    console.log(`Mobile: ${s.mobile}`)
    console.log(`Approved: ${s.approved}`)
    console.log(`Language: ${s.language}`)
    console.log(`School: ${s.school?.name || 'N/A'}`)
    console.log(`Classroom: ${s.classroom?.name || 'N/A'}`)
    console.log('----------------------------')
  })

  console.log('=== ATTEMPTS ===')
  const attempts = await prisma.examAttempt.findMany({
    include: {
      student: { select: { name: true, mobile: true } },
      exam: { select: { name: true } }
    },
    orderBy: { startedAt: 'desc' }
  })
  attempts.forEach((a) => {
    console.log(`Attempt ID: ${a.id}`)
    console.log(`Student: ${a.student?.name} (${a.student?.mobile})`)
    console.log(`Exam: ${a.exam?.name}`)
    console.log(`Completed: ${a.completed}`)
    console.log(`Started: ${a.startedAt}`)
    console.log(`Submitted: ${a.submittedAt}`)
    console.log('----------------------------')
  })
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
