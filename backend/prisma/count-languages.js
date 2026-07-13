const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const enCount = await prisma.school.count({ where: { language: 'en' } })
  const hiCount = await prisma.school.count({ where: { language: 'hi' } })
  console.log(`English schools count: ${enCount}`)
  console.log(`Hindi schools count: ${hiCount}`)
  if (hiCount > 0) {
    const hiSchools = await prisma.school.findMany({ where: { language: 'hi' } })
    console.log("Hindi schools list:", hiSchools)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
