import { jsPDF } from 'jspdf'

export function generateCertificatePDF(data: {
  studentName: string
  schoolName: string
  classroomName: string
  examName: string
  completedAt: string | Date
  language?: string
}) {
  // Check if we are running in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = 2000
  canvas.height = 1414
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Fill white background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 2000, 1414)

  const scale = (mm: number) => mm * 6.734
  const scaleSize = (pt: number) => Math.round(pt * 2.37)

  // Draw elegant double border
  ctx.strokeStyle = 'rgb(197, 168, 128)' // Muted Gold (#c5a880)
  
  ctx.lineWidth = scale(0.5)
  ctx.strokeRect(scale(10), scale(10), scale(277), scale(190))

  ctx.lineWidth = scale(1.5)
  ctx.strokeRect(scale(12), scale(12), scale(273), scale(186))

  const isHindi = data.language === 'hi'
  const fontStack = isHindi 
    ? "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Mangal', 'Segoe UI', system-ui, sans-serif"
    : "'Times New Roman', Georgia, serif"

  const setCanvasFont = (style: string, sizePt: number) => {
    const sizePx = scaleSize(sizePt)
    if (style === 'italic') {
      ctx.font = `italic ${sizePx}px ${fontStack}`
    } else if (style === 'bold') {
      ctx.font = `bold ${sizePx}px ${fontStack}`
    } else if (style === 'bolditalic') {
      ctx.font = `bold italic ${sizePx}px ${fontStack}`
    } else {
      ctx.font = `${sizePx}px ${fontStack}`
    }
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Certificate Header
  setCanvasFont('italic', 20)
  ctx.fillStyle = 'rgb(110, 107, 100)' // Muted gray
  const headerText = isHindi ? 'सहभागिता का प्रमाण पत्र' : 'Certificate of Participation'
  ctx.fillText(headerText, scale(297 / 2), scale(45))

  // Large Bold Title
  setCanvasFont('bold', 32)
  ctx.fillStyle = 'rgb(27, 45, 66)' // Primary Navy
  const titleText = isHindi ? 'सहभागिता प्रमाण पत्र' : 'PARTICIPATION CERTIFICATE'
  ctx.fillText(titleText, scale(297 / 2), scale(62))

  // Presentation line
  setCanvasFont('normal', 15)
  ctx.fillStyle = 'rgb(44, 44, 44)'
  const presentText = isHindi ? 'यह प्रमाण पत्र गर्व से प्रदान किया जाता है' : 'This is proudly presented to'
  ctx.fillText(presentText, scale(297 / 2), scale(80))

  // Student Name
  setCanvasFont('bolditalic', 26)
  ctx.fillStyle = 'rgb(179, 146, 102)' // Gold
  ctx.fillText(data.studentName, scale(297 / 2), scale(98))

  // Divider line
  ctx.strokeStyle = 'rgb(197, 168, 128)'
  ctx.lineWidth = scale(0.5)
  ctx.beginPath()
  ctx.moveTo(scale(297 / 2 - 60), scale(103))
  ctx.lineTo(scale(297 / 2 + 60), scale(103))
  ctx.stroke()

  // Description
  setCanvasFont('normal', 14)
  ctx.fillStyle = 'rgb(44, 44, 44)'
  const descText = isHindi 
    ? 'ऑनलाइन परीक्षा में सक्रिय रूप से भाग लेने के लिए:' 
    : 'for actively participating in the online examination:'
  ctx.fillText(descText, scale(297 / 2), scale(115))

  // Exam Name
  setCanvasFont('bold', 18)
  ctx.fillStyle = 'rgb(27, 45, 66)'
  ctx.fillText(data.examName, scale(297 / 2), scale(127))

  // Date
  setCanvasFont('normal', 14)
  ctx.fillStyle = 'rgb(44, 44, 44)'
  
  const formattedDate = new Date(data.completedAt).toLocaleDateString(
    isHindi ? 'hi-IN' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  )
  const dateText = isHindi ? `आयोजन तिथि: ${formattedDate}` : `held on ${formattedDate}.`
  ctx.fillText(dateText, scale(297 / 2), scale(137))

  // School and Class Metadata
  setCanvasFont('italic', 12)
  ctx.fillStyle = 'rgb(44, 44, 44)'
  const metaText = isHindi 
    ? `कक्षा: ${data.classroomName}   |   विद्यालय: ${data.schoolName}`
    : `Classroom: ${data.classroomName}   |   School: ${data.schoolName}`
  ctx.fillText(metaText, scale(297 / 2), scale(155))

  // Footer signatures lines and labels
  ctx.strokeStyle = 'rgb(197, 168, 128)'
  ctx.lineWidth = scale(0.3)
  
  // Left signature line
  ctx.beginPath()
  ctx.moveTo(scale(40), scale(180))
  ctx.lineTo(scale(90), scale(180))
  ctx.stroke()
  
  setCanvasFont('normal', 12)
  ctx.fillStyle = 'rgb(44, 44, 44)'
  const signatoryText = isHindi ? 'अधिकृत हस्ताक्षरकर्ता' : 'Authorized Signatory'
  ctx.fillText(signatoryText, scale(65), scale(186))

  // Right signature line
  ctx.beginPath()
  ctx.moveTo(scale(297 - 90), scale(180))
  ctx.lineTo(scale(297 - 40), scale(180))
  ctx.stroke()
  
  const coordinatorText = isHindi ? 'परीक्षा समन्वयक' : 'Exam Coordinator'
  ctx.fillText(coordinatorText, scale(297 - 65), scale(186))

  // Convert canvas to image and add to PDF
  const imgData = canvas.toDataURL('image/jpeg', 0.98)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })
  doc.addImage(imgData, 'JPEG', 0, 0, 297, 210)

  // Save the PDF
  const suffix = isHindi ? 'सहभागिता_प्रमाण_पत्र' : 'Participation_Certificate'
  const filename = `${data.studentName.replace(/\s+/g, '_')}_${suffix}.pdf`

  if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
    try {
      const pdfDataUri = doc.output('datauristring');
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'DOWNLOAD_PDF',
        pdfData: pdfDataUri,
        filename
      }));
    } catch (err) {
      doc.save(filename);
    }
  } else {
    doc.save(filename);
  }
}
