const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'SchoolExam';
  `
  console.log('Columns in SchoolExam:', columns)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
