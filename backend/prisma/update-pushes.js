const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.schoolExam.updateMany({
    data: {
      pushedAt: new Date(),
    },
  })
  console.log(`Updated ${result.count} existing school exams with current date.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
