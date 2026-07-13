const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Starting flat migration of schools...')

  // 1. Get all schools and translations
  const schools = await prisma.school.findMany({
    include: {
      translations: true,
      classrooms: true,
    }
  })
  console.log(`Found ${schools.length} parent schools to process.`)

  for (const school of schools) {
    const enTrans = school.translations.find(t => t.language === 'en')
    const hiTrans = school.translations.find(t => t.language === 'hi')

    if (!enTrans) {
      console.log(`Warning: School ${school.id} (UDISE: ${school.udise}) has no English translation. Skipping.`)
      continue
    }

    console.log(`Processing school: ${enTrans.name} (UDISE: ${school.udise})`)

    // 2. Update English school (existing row) with name, tehsil, district, and language = 'en'
    await prisma.school.update({
      where: { id: school.id },
      data: {
        name: enTrans.name,
        tehsil: enTrans.tehsil,
        district: enTrans.district,
        language: 'en',
      }
    })

    if (hiTrans) {
      // 3. Create or update Hindi school as a separate row
      // We upsert by the composite key [udise, language]
      const hindiSchool = await prisma.school.upsert({
        where: {
          udise_language: {
            udise: school.udise,
            language: 'hi',
          }
        },
        update: {
          name: hiTrans.name,
          tehsil: hiTrans.tehsil,
          district: hiTrans.district,
        },
        create: {
          name: hiTrans.name,
          udise: school.udise,
          tehsil: hiTrans.tehsil,
          district: hiTrans.district,
          language: 'hi',
          adminId: school.adminId,
          questionSetName: school.questionSetName,
        }
      })

      // 4. Map classrooms to Hindi school (link in SchoolClassroom)
      for (const sc of school.classrooms) {
        await prisma.schoolClassroom.upsert({
          where: {
            schoolId_classroomId: {
              schoolId: hindiSchool.id,
              classroomId: sc.classroomId,
            }
          },
          update: {},
          create: {
            schoolId: hindiSchool.id,
            classroomId: sc.classroomId,
          }
        })
      }

      // 5. Update any students who registered in Hindi and belong to this UDISE
      // to point to the new Hindi school record!
      const updatedStudents = await prisma.student.updateMany({
        where: {
          schoolId: school.id,
          language: 'hi',
        },
        data: {
          schoolId: hindiSchool.id,
        }
      })
      if (updatedStudents.count > 0) {
        console.log(`Updated ${updatedStudents.count} Hindi student profiles to point to Hindi school ${hindiSchool.id}`)
      }
    }
  }

  console.log('Flat migration completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
