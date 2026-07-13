const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: 'desc' }
  })
  console.log(`Total schools in DB: ${schools.length}`)
  console.log(JSON.stringify(schools, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
