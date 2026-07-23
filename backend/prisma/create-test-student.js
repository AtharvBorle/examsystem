const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('Password123', 10)

  // 1. Get or Create SuperAdmin
  let superAdmin = await prisma.superAdmin.findFirst()
  if (!superAdmin) {
    superAdmin = await prisma.superAdmin.create({
      data: {
        email: 'superadmin@exam.com',
        password: hashedPassword
      }
    })
  }

  // 2. Get or Create Admin
  let admin = await prisma.admin.findUnique({
    where: { mobile: '9999999999' }
  })
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        email: 'admin@exam.com',
        mobile: '9999999999',
        password: hashedPassword,
        createdById: superAdmin.id
      }
    })
  }

  // 3. Get or Create School
  let school = await prisma.school.findFirst({
    where: { udise: '12345678901' }
  })
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Mock Test School',
        udise: '12345678901',
        district: 'Test District',
        tehsil: 'Test Tehsil',
        language: 'en',
        adminId: admin.id
      }
    })
  }

  // 4. Get or Create Classroom
  let classroom = await prisma.classroom.findFirst({
    where: { name: 'Class 10' }
  })
  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: {
        name: 'Class 10'
      }
    })
    // Bind classroom to school
    await prisma.schoolClassroom.create({
      data: {
        schoolId: school.id,
        classroomId: classroom.id
      }
    })
  }

  // 5. Create Test Student
  let student = await prisma.student.findUnique({
    where: { mobile: '8888888888' }
  })
  if (!student) {
    student = await prisma.student.create({
      data: {
        name: 'Test Student',
        mobile: '8888888888',
        password: hashedPassword,
        schoolId: school.id,
        classroomId: classroom.id,
        district: 'Test District',
        tehsil: 'Test Tehsil',
        language: 'en',
        approved: true
      }
    })
    console.log('✅ Mock Student created successfully!')
    console.log('Mobile: 8888888888')
    console.log('Password: Password123')
  } else {
    console.log('Mock Student already exists.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
