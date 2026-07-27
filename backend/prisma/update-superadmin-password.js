const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  const newPassword = args[0]

  if (!newPassword) {
    console.error('❌ Error: Please provide the new password as an argument.')
    console.log('Usage: node prisma/update-superadmin-password.js <new_password>')
    process.exit(1)
  }

  // Find the superadmin
  const superAdmin = await prisma.superAdmin.findFirst()
  if (!superAdmin) {
    console.error('❌ Error: No Super-Admin record found in the database. Run seed script first.')
    process.exit(1)
  }

  // Hash with 6 rounds (optimized for peak performance)
  const hashedPassword = await bcrypt.hash(newPassword, 6)

  await prisma.superAdmin.update({
    where: { id: superAdmin.id },
    data: { password: hashedPassword }
  })

  console.log('----------------------------------------------------')
  console.log('✅ Super-Admin password updated successfully!')
  console.log(`Email: ${superAdmin.email}`)
  console.log(`Mobile: ${superAdmin.mobile}`)
  console.log('----------------------------------------------------')
}

main()
  .catch((e) => {
    console.error('❌ Error updating password:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
