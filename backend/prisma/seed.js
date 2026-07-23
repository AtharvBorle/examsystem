const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'superadmin@exam.com'
  const password = 'SuperSecurePassword123!'

  const existingSuper = await prisma.superAdmin.findUnique({
    where: { email },
  })

  if (!existingSuper) {
    const hashedPassword = await bcrypt.hash(password, 6)
    await prisma.superAdmin.create({
      data: {
        email,
        password: hashedPassword,
      },
    })
    console.log('----------------------------------------------------')
    console.log('Super-Admin created successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log('----------------------------------------------------')
  } else {
    console.log('Super-Admin already exists.')
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
