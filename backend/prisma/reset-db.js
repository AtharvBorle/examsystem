const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🚀 Starting Database Clean Sweep (Wiping all data except SuperAdmin)...')

  // 1. Delete dependent leaf records first to avoid foreign key constraints
  console.log('Clearing Exam Attempts...')
  await prisma.examAttempt.deleteMany({})

  console.log('Clearing Students...')
  await prisma.student.deleteMany({})

  console.log('Clearing School-Exam mappings...')
  await prisma.schoolExam.deleteMany({})

  console.log('Clearing Exam-Group mappings...')
  await prisma.examGroup.deleteMany({})

  console.log('Clearing Exam-Question mappings...')
  await prisma.examQuestion.deleteMany({})

  console.log('Clearing Exams...')
  await prisma.exam.deleteMany({})

  console.log('Clearing Group-Classroom mappings...')
  await prisma.groupClassroom.deleteMany({})

  console.log('Clearing Groups...')
  await prisma.group.deleteMany({})

  console.log('Clearing Question Translations...')
  await prisma.questionTranslation.deleteMany({})

  console.log('Clearing Question Masters...')
  await prisma.questionMaster.deleteMany({})

  console.log('Clearing Subcategories...')
  await prisma.subcategory.deleteMany({})

  console.log('Clearing Categories...')
  await prisma.category.deleteMany({})

  console.log('Clearing School-Classroom mappings...')
  await prisma.schoolClassroom.deleteMany({})

  console.log('Clearing Schools...')
  await prisma.school.deleteMany({})

  console.log('Clearing Classrooms...')
  await prisma.classroom.deleteMany({})

  console.log('Clearing Resources...')
  await prisma.resource.deleteMany({})

  console.log('Clearing OTP records...')
  await prisma.otp.deleteMany({})

  console.log('Clearing Admins...')
  await prisma.admin.deleteMany({})

  // 2. Check SuperAdmin accounts
  const superAdminCount = await prisma.superAdmin.count()
  console.log(`Found ${superAdminCount} SuperAdmin account(s).`)

  if (superAdminCount === 0) {
    console.log('No SuperAdmin found. Creating default SuperAdmin account...')
    const email = 'superadmin@exam.com'
    const mobile = '9999999999'
    const password = 'SuperSecurePassword123!'
    const hashedPassword = await bcrypt.hash(password, 6)

    await prisma.superAdmin.create({
      data: {
        email,
        mobile,
        password: hashedPassword,
      },
    })
    console.log('----------------------------------------------------')
    console.log('Default SuperAdmin created:')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log('----------------------------------------------------')
  } else {
    console.log('All SuperAdmin accounts were safely preserved!')
  }

  console.log('✅ Database reset complete! Only SuperAdmin accounts remain in the database.')
}

resetDatabase()
  .catch((e) => {
    console.error('❌ Error resetting database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
