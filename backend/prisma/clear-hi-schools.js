const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Mapping students from Hindi schools back to English counterparts...')
  
  // Find all students pointing to schools that have language = 'hi'
  const students = await prisma.student.findMany({
    where: {
      school: {
        language: 'hi'
      }
    },
    include: {
      school: true
    }
  })

  console.log(`Found ${students.length} students to remap.`)

  for (const student of students) {
    // Find the English school with the same UDISE
    const enSchool = await prisma.school.findFirst({
      where: {
        udise: student.school.udise,
        language: 'en'
      }
    })

    if (enSchool) {
      await prisma.student.update({
        where: { id: student.id },
        data: { schoolId: enSchool.id }
      })
      console.log(`Student ${student.name} remapped to English school ${enSchool.name}`)
    } else {
      console.log(`Warning: No English school found for UDISE ${student.school.udise}. Student ${student.name} not remapped.`)
    }
  }

  // Delete all Hindi schools
  const result = await prisma.school.deleteMany({
    where: { language: 'hi' }
  })
  console.log(`Deleted ${result.count} auto-translated Hindi school records.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
