const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const admins = await prisma.admin.findMany()
  console.log("Admins:", admins.map(u => ({ id: u.id, email: u.email })))
  const schools = await prisma.school.findMany({ select: { name: true, language: true, adminId: true, udise: true } })
  console.log("Schools count:", schools.length)
  console.log("Schools sample:", schools.slice(0, 10))
}
main().catch(console.error).finally(() => prisma.$disconnect())
