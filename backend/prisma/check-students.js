const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()
const JWT_SECRET = "fallback-super-secret-exam-system-key-2026"

async function main() {
  const student = await prisma.student.findUnique({
    where: { mobile: '1212121212' },
  })
  
  const payload = {
    userId: student.id,
    role: 'STUDENT',
    mobile: student.mobile
  }
  
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  console.log("Signed Token for Student:", token)

  const exam = await prisma.exam.findFirst()
  if (!exam) {
    console.log("No exams found in database.")
    return
  }
  console.log("Selected Exam ID:", exam.id)

  // Now, call the start API locally by importing the route logic or calling the fetch locally
  // Since the dev server is running on localhost:5000, we can fetch from it!
  const url = `http://localhost:5000/api/student/exams/attempt/start`
  console.log("Sending POST to:", url)
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ examId: exam.id })
    })
    console.log("Status:", res.status)
    const text = await res.text()
    console.log("Response text:", text)
  } catch (err) {
    console.error("Fetch failed:", err)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
