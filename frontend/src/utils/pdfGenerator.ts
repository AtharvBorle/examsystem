import { jsPDF } from 'jspdf'
import certificateBg from '../assets/Certificatebackground.jpg'
import letterheadAsset from '../assets/letterhead.png'

const loadPdfImage = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}


// Helper to translate classroom names to Hindi (Frontend-safe version)
function translateClassroomToHindi(name: string): string {
  if (!name) return ''
  const cleaned = name.trim()
  
  const HINDI_ORDINALS: { [key: number]: string } = {
    1: 'पहली कक्षा (1 कक्षा)',
    2: 'दूसरी कक्षा (2 कक्षा)',
    3: 'तीसरी कक्षा (3 कक्षा)',
    4: 'चौथी कक्षा (4 कक्षा)',
    5: 'पाँचवीं कक्षा (5 कक्षा)',
    6: 'छठी कक्षा (6 कक्षा)',
    7: 'सातवीं कक्षा (7 कक्षा)',
    8: 'आठवीं कक्षा (8 कक्षा)',
    9: 'नौवीं कक्षा (9 कक्षा)',
    10: 'दसवीं कक्षा (10 कक्षा)',
    11: 'ग्यारहवीं कक्षा (11 कक्षा)',
    12: 'बारहवीं कक्षा (12 कक्षा)',
  }
  
  const ROMAN_MAP: { [key: string]: number } = {
    xii: 12, xi: 11, x: 10, ix: 9, viii: 8, vii: 7, vi: 6, v: 5, iv: 4, iii: 3, ii: 2, i: 1
  }
  
  const FALLBACK_WORDS: { [key: string]: string } = {
    nursery: 'नर्सरी (Nursery)',
    lkg: 'एल.के.जी. (LKG)',
    ukg: 'यू.के.जी. (UKG)',
    balvatika: 'बालवाटिका (Balvatika)',
    'pre-primary': 'पूर्व-प्राथमिक (Pre-primary)',
    classroom: 'कक्षा',
    class: 'कक्षा',
  }

  const numMatch = cleaned.match(/(12|11|10|[1-9])/)
  const romanMatch = cleaned.match(/\b(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/i)

  let num: number | null = null
  if (numMatch) {
    num = parseInt(numMatch[1])
  } else if (romanMatch) {
    num = ROMAN_MAP[romanMatch[1].toLowerCase()]
  }

  if (num && HINDI_ORDINALS[num]) {
    let hindiName = HINDI_ORDINALS[num]
    const sectionMatch = cleaned.match(/\b([A-D])\b/i)
    if (sectionMatch) {
      const section = sectionMatch[1].toUpperCase()
      const hindiSection = section === 'A' ? 'ए' : section === 'B' ? 'बी' : section === 'C' ? 'सी' : 'डी'
      hindiName += ` - ${hindiSection}`
    }
    return hindiName
  }

  const lower = cleaned.toLowerCase()
  for (const [engWord, hiWord] of Object.entries(FALLBACK_WORDS)) {
    if (lower.includes(engWord)) {
      return hiWord
    }
  }

  return name
}

// Helper to translate school names to Hindi (Frontend-safe version)
function translateSchoolToHindi(name: string): string {
  if (!name) return ''
  if (/[\u0900-\u097F]/.test(name)) {
    return name
  }

  const SCHOOL_WORD_MAP: { [key: string]: string } = {
    school: 'स्कूल',
    academy: 'अकादमी',
    public: 'पब्लिक',
    international: 'इंटरनेशनल',
    english: 'इंग्लिश',
    medium: 'मीडियम',
    hindi: 'हिंदी',
    marathi: 'मराठी',
    'high school': 'हाई स्कूल',
    highschool: 'हाईस्कूल',
    primary: 'प्राथमिक',
    secondary: 'माध्यमिक',
    higher: 'उच्च',
    govt: 'शासकीय',
    government: 'शासकीय',
    zilla: 'जिला',
    parishad: 'परिषद',
    'z.p.': 'जि.प.',
    'z p': 'जि.प.',
    zp: 'जि.प.',
    vidyalaya: 'विद्यालय',
    shala: 'शाला',
    model: 'मॉडल',
    boys: 'बॉयज',
    girls: 'गर्ल्स',
    memorial: 'मेमोरियल',
    convent: 'कॉन्वेंट',
    'junior college': 'जूनियर कॉलेज',
    college: 'कॉलेज',
    national: 'नेशनल',
    modern: 'मॉडर्न',
    golden: 'गोल्डन',
    valley: 'वैली',
    bright: 'ब्राइट',
    future: 'फ्यूचर',
    little: 'लिटिल',
    flower: 'फ्लावर',
    st: 'सेंट',
    saint: 'सेंट',
    holy: 'होली',
    cross: 'क्रॉस',
    heart: 'हार्ट',
    infant: 'इन्फेंट',
    jesus: 'जीसस',
    mary: 'मैरी',
    central: 'सेंट्रल',
    education: 'एजुकेशन',
    trust: 'ट्रस्ट',
    society: 'सोसाइटी',
    institution: 'इंस्टीट्यूशन',
    group: 'ग्रुप',
    new: 'न्यू',
    era: 'एरा',
  }

  let lower = name.toLowerCase().trim()
  if (lower === 'new era academy') return 'न्यू एरा अकादमी'
  if (lower === 'new era school') return 'न्यू एरा स्कूल'

  let translated = name
  const multiWords = ['high school', 'junior college', 'english medium', 'zilla parishad']
  for (const mw of multiWords) {
    if (lower.includes(mw)) {
      const regex = new RegExp(`\\b${mw}\\b`, 'gi')
      translated = translated.replace(regex, SCHOOL_WORD_MAP[mw])
    }
  }

  const tokens = translated.split(/\s+/)
  const mappedTokens = tokens.map(token => {
    const cleanToken = token.toLowerCase().replace(/[^a-z0-9.]/g, '')
    if (SCHOOL_WORD_MAP[cleanToken]) {
      return SCHOOL_WORD_MAP[cleanToken]
    }
    return token
  })

  return mappedTokens.join(' ')
}

// Helper to translate exam names to Hindi (Frontend-safe version)
function translateExamToHindi(name: string): string {
  if (!name) return ''
  if (/[\u0900-\u097F]/.test(name)) {
    return name
  }
  const lower = name.toLowerCase().trim()
  if (lower === 'examination' || lower === 'exam') return 'परीक्षा'
  
  const EXAM_WORDS: { [key: string]: string } = {
    examination: 'परीक्षा',
    exam: 'परीक्षा',
    term: 'सत्र',
    semester: 'समेस्टर',
    quarterly: 'त्रैमासिक',
    half: 'अर्धवार्षिक',
    yearly: 'वार्षिक',
    annual: 'वार्षिक',
    weekly: 'सापचारिक',
    monthly: 'मासिक',
    test: 'परीक्षण',
    final: 'अंतिम',
    first: 'प्रथम',
    second: 'द्वितीय',
    third: 'तृतीय',
  }

  const tokens = name.split(/\s+/)
  const mappedTokens = tokens.map(token => {
    const cleanToken = token.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (EXAM_WORDS[cleanToken]) {
      return EXAM_WORDS[cleanToken]
    }
    return token
  })

  return mappedTokens.join(' ')
}

const GEOGRAPHY_MAP: { [key: string]: { en: string; hi: string } } = {
  amravati: { en: 'Amravati', hi: 'अमरावती' },
  latur: { en: 'Latur', hi: 'लातूर' },
  pune: { en: 'Pune', hi: 'पुणे' },
  mumbai: { en: 'Mumbai', hi: 'मुंबई' },
  nagpur: { en: 'Nagpur', hi: 'नागपुर' },
  snagpur: { en: 'Nagpur', hi: 'नागपुर' },
  nashik: { en: 'Nashik', hi: 'नाशिक' },
  thane: { en: 'Thane', hi: 'ठाणे' },
  aurangabad: { en: 'Aurangabad', hi: 'औरंगाबाद' },
  'chhatrapati sambhajinagar': { en: 'Chhatrapati Sambhajinagar', hi: 'छत्रपति संभाजीनगर' },
  solapur: { en: 'Solapur', hi: 'सोलापुर' },
  kolhapur: { en: 'Kolhapur', hi: 'कोल्हापुर' },
  jalgaon: { en: 'Jalgaon', hi: 'जलगांव' },
  nanded: { en: 'Nanded', hi: 'नांंदेड' },
  satara: { en: 'Satara', hi: 'सतारा' },
  sangli: { en: 'सांगली', hi: 'सांगली' },
  akola: { en: 'Akola', hi: 'अकोला' },
  yavatmal: { en: 'Yavatmal', hi: 'यवतमाल' },
  buldhana: { en: 'Buldhana', hi: 'बुलढाणा' },
  washim: { en: 'Washim', hi: 'वाशिम' },
  wardha: { en: 'Wardha', hi: 'वर्धा' },
  bhandara: { en: 'Bhandara', hi: 'भंडारा' },
  gondia: { en: 'Gondia', hi: 'गोंदिया' },
  chandrapur: { en: 'Chandrapur', hi: 'चंद्रपुर' },
  gadchiroli: { en: 'Gadchiroli', hi: 'गडचिरोली' },
  osmanabad: { en: 'Osmanabad', hi: 'उस्मानाबाद' },
  dharashiv: { en: 'Dharashiv', hi: 'धाराशिव' },
  beed: { en: 'Beed', hi: 'बीड' },
  jalna: { en: 'Jalna', hi: 'जालना' },
  parbhani: { en: 'Parbhani', hi: 'परभणी' },
  hingoli: { en: 'Hingoli', hi: 'हिंगोली' },
  ahmednagar: { en: 'Ahmednagar', hi: 'अहमदनगर' },
  dhule: { en: 'Dhule', hi: 'धुले' },
  nandurbar: { en: 'Nandurbar', hi: 'नंदुरबार' },
  ratnagiri: { en: 'Ratnagiri', hi: 'रत्नागिरी' },
  sindhudurg: { en: 'Sindhudurg', hi: 'सिंधुदुर्ग' },
  raigad: { en: 'Raigad', hi: 'रायगढ़' },
  palghar: { en: 'Palghar', hi: 'पालघर' },
}

function translateGeography(value: string, toHindi: boolean): string {
  if (!value) return ''
  const cleaned = value.trim().toLowerCase()
  if (GEOGRAPHY_MAP[cleaned]) {
    return toHindi ? GEOGRAPHY_MAP[cleaned].hi : GEOGRAPHY_MAP[cleaned].en
  }
  for (const item of Object.values(GEOGRAPHY_MAP)) {
    if (item.hi.toLowerCase() === cleaned || item.en.toLowerCase() === cleaned) {
      return toHindi ? item.hi : item.en
    }
  }
  return value
}

export async function generateCertificatePDF(data: {
  studentName: string
  schoolName: string
  classroomName: string
  examName: string
  completedAt: string | Date
  language?: string
  district?: string
  tehsil?: string
  branch?: string
  presidentName?: string
  presidentSignature?: string
  secretaryName?: string
  secretarySignature?: string
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

  // Load backdrop template image
  const bgImg = new Image()
  bgImg.src = certificateBg
  await new Promise<void>((resolve) => {
    bgImg.onload = () => {
      ctx.drawImage(bgImg, 0, 0, 2000, 1414)
      resolve()
    }
    bgImg.onerror = () => {
      console.error('Failed to load certificate background image')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 2000, 1414)
      resolve()
    }
  })

  const scale = (mm: number) => mm * 6.734
  const scaleSize = (pt: number) => Math.round(pt * 2.37)

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

  // 1. Branch Name (Bigger, 2 Lines)
  setCanvasFont('bold', 20.5)
  ctx.fillStyle = 'rgb(220, 95, 0)' // Vibrant Orange / Saffron
  const line1Text = isHindi ? 'भारत विकास परिषद' : 'BHARAT VIKAS PARISHAD'
  ctx.fillText(line1Text, scale(297 / 2), scale(30))

  let line2Text = ''
  if (data.branch) {
    const rawBranch = data.branch.trim()
    const cleaned = isHindi 
      ? rawBranch.replace(/^भारत विकास परिषद\s*/g, '').trim()
      : rawBranch.replace(/^Bharat Vikas Parishad\s*/gi, '').trim()
    line2Text = cleaned || (isHindi ? 'शाखा' : 'BRANCH')
  } else {
    line2Text = isHindi ? 'शाखा' : 'BRANCH'
  }
  ctx.fillText(line2Text, scale(297 / 2), scale(41))

  // 2. Large Bold Title
  setCanvasFont('bold', 33)
  ctx.fillStyle = 'rgb(12, 34, 64)'
  const titleText = isHindi ? 'सहभागिता प्रमाण पत्र' : 'CERTIFICATE'
  ctx.fillText(titleText, scale(297 / 2), scale(56))

  // 3. Subtitle
  setCanvasFont('bold', 14.5)
  ctx.fillStyle = 'rgb(12, 34, 64)'
  const subtitleText = isHindi ? 'सहभागिता का' : 'OF PARTICIPATION'
  ctx.fillText(subtitleText, scale(297 / 2), scale(68))

  // 4. Presentation line
  setCanvasFont('bold', 13)
  ctx.fillStyle = 'rgb(12, 34, 64)'
  const presentText = isHindi ? 'यह प्रमाण पत्र गर्व से प्रदान किया जाता है' : 'This certificate is proudly presented to'
  ctx.fillText(presentText, scale(297 / 2), scale(78))

  // 5. Student Name
  setCanvasFont('bold', 30)
  ctx.fillStyle = 'rgb(197, 160, 89)' // Elegant Gold
  ctx.fillText(data.studentName, scale(297 / 2), scale(93))

  // Name Underline
  ctx.strokeStyle = 'rgb(226, 232, 240)'
  ctx.lineWidth = scale(0.4)
  ctx.beginPath()
  ctx.moveTo(scale(297 / 2 - 100), scale(101))
  ctx.lineTo(scale(297 / 2 + 100), scale(101))
  ctx.stroke()

  // 6. Description Text
  setCanvasFont('bold', 13)
  ctx.fillStyle = 'rgb(12, 34, 64)'
  const descText = isHindi 
    ? 'प्रतियोगिता में सक्रिय रूप से भाग लेने के लिए, जो भारत के सामान्य ज्ञान पर केंद्रित है।' 
    : 'For actively participating in the competition, which focuses on general knowledge about India.'
  ctx.fillText(descText, scale(297 / 2), scale(112))

  // 7. Combined Exam Name & Held On Date in ONE Line
  setCanvasFont('bold', 16.5)
  ctx.fillStyle = 'rgb(12, 34, 64)'
  const displayExam = isHindi ? translateExamToHindi(data.examName) : data.examName
  const formattedDate = new Date(data.completedAt).toLocaleDateString(
    isHindi ? 'hi-IN' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  )
  const dateText = isHindi ? `आयोजन तिथि: ${formattedDate}` : `Held On ${formattedDate}`
  const examAndDateCombined = `${displayExam}    •    ${dateText}`
  ctx.fillText(examAndDateCombined, scale(297 / 2), scale(127))

  // 8. Class / School / Geography Details Row
  setCanvasFont('bold', 11.5)
  ctx.fillStyle = 'rgb(12, 34, 64)'
  const displayClassroom = isHindi ? translateClassroomToHindi(data.classroomName) : data.classroomName
  const displaySchool = isHindi ? translateSchoolToHindi(data.schoolName) : data.schoolName
  const displayDistrict = translateGeography(data.district || '', isHindi)
  const displayTehsil = translateGeography(data.tehsil || '', isHindi)

  const detailsText = isHindi 
    ? `कक्षा : ${displayClassroom}      विद्यालय : ${displaySchool}      जिला : ${displayDistrict}      तालुका : ${displayTehsil}`
    : `Classroom : ${displayClassroom}      School : ${displaySchool}      District : ${displayDistrict}      Taluka : ${displayTehsil}`
  ctx.fillText(detailsText, scale(297 / 2), scale(143))

  // Helpers to load dynamic signatory images from server disk
  const loadSigImg = (src: string) => {
    return new Promise<HTMLImageElement | null>((resolve) => {
      if (!src) return resolve(null)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      if (src.startsWith('/')) {
        img.src = window.location.origin + src
      } else {
        img.src = src
      }
    })
  }

  // 10. Left Signature (President/अध्यक्ष)
  if (data.presidentSignature) {
    const presSig = await loadSigImg(data.presidentSignature)
    if (presSig) {
      // Draw signature image centered over the President title
      ctx.drawImage(presSig, scale(85) - (14 * 6.734), scale(163), 28 * 6.734, 11 * 6.734)
    }
  }
  setCanvasFont('bold', 11.5)
  ctx.fillStyle = 'rgb(45, 55, 72)'
  ctx.fillText(isHindi ? 'अध्यक्ष' : 'President', scale(85), scale(179))

  setCanvasFont('bold', 12.5)
  ctx.fillStyle = 'rgb(12, 34, 64)'
  const presName = data.presidentName || ''
  ctx.fillText(presName, scale(85), scale(187))


  // 11. Right Signature (Secretary/सचिव)
  if (data.secretarySignature) {
    const secSig = await loadSigImg(data.secretarySignature)
    if (secSig) {
      // Draw signature image centered over the Secretary title
      ctx.drawImage(secSig, scale(297 - 85) - (14 * 6.734), scale(163), 28 * 6.734, 11 * 6.734)
    }
  }
  setCanvasFont('bold', 11.5)
  ctx.fillStyle = 'rgb(45, 55, 72)'
  ctx.fillText(isHindi ? 'सचिव' : 'Secretary', scale(297 - 85), scale(179))

  setCanvasFont('bold', 12.5)
  ctx.fillStyle = 'rgb(12, 34, 64)'
  const secName = data.secretaryName || ''
  ctx.fillText(secName, scale(297 - 85), scale(187))

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


export function generateAnswersheetPDF(data: {
  studentName: string
  examName: string
  completedAt: string | Date
  score: number
  correctAnswers: number
  totalQuestions: number
  language?: string
  questions: Array<{
    id: string
    text: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    correctOption: string
    referenceImage?: string | null
    studentResponse?: string | null
  }>
}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const isHindi = data.language === 'hi'
  const fontStack = isHindi 
    ? "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Mangal', 'Segoe UI', system-ui, sans-serif"
    : "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

  const setFont = (ctx: CanvasRenderingContext2D, style: 'normal' | 'bold' | 'italic', size: number) => {
    ctx.font = `${style === 'normal' ? '' : style} ${size}px ${fontStack}`
  }

  const pages: string[] = []
  let canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 1700
  let ctx = canvas.getContext('2d')!

  const initPage = (pageNum: number) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1200, 1700)
    
    // Page border
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 4
    ctx.strokeRect(20, 20, 1160, 1660)

    // Page footer
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#718096'
    ctx.textAlign = 'center'
    ctx.fillText(
      isHindi ? `पृष्ठ ${pageNum}` : `Page ${pageNum}`,
      600,
      1650
    )
    ctx.textAlign = 'left'
  }

  let pageCount = 1
  initPage(pageCount)

  // Draw Header on first page
  let y = 60
  ctx.fillStyle = '#1b2d42' // Navy background banner
  ctx.fillRect(30, y, 1140, 80)
  
  ctx.textAlign = 'center'
  setFont(ctx, 'bold', 24)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(
    isHindi ? 'परीक्षा उत्तर पुस्तिका' : 'EXAM ANSWERSHEET',
    600,
    y + 40
  )
  ctx.textAlign = 'left'
  
  y += 110

  // Calculate detailed stats
  const attemptedCount = data.questions.filter(q => q.studentResponse && q.studentResponse.trim() !== '').length
  const wrongCount = data.questions.filter(q => q.studentResponse && q.studentResponse.trim() !== '' && q.studentResponse !== q.correctOption).length
  const unansweredCount = data.totalQuestions - attemptedCount

  // Draw metadata box
  ctx.fillStyle = '#f7fafc'
  ctx.fillRect(30, y, 1140, 130)
  ctx.strokeStyle = '#cbd5e0'
  ctx.lineWidth = 1
  ctx.strokeRect(30, y, 1140, 130)

  // Labels (Col 1: 55, Col 2: 560, Col 3: 880)
  setFont(ctx, 'bold', 14)
  ctx.fillStyle = '#2d3748'
  ctx.fillText(isHindi ? `छात्र का नाम: ` : `Student Name: `, 55, y + 35)
  ctx.fillText(isHindi ? `परीक्षा का नाम: ` : `Exam Name: `, 55, y + 70)
  ctx.fillText(isHindi ? `दिनांक: ` : `Date: `, 55, y + 105)

  ctx.fillText(isHindi ? `प्राप्तांक: ` : `Score: `, 560, y + 35)
  ctx.fillText(isHindi ? `प्रयास किए गए: ` : `Attempted: `, 560, y + 70)
  ctx.fillText(isHindi ? `अनुत्तरित: ` : `Unanswered: `, 560, y + 105)

  ctx.fillText(isHindi ? `सही उत्तर: ` : `Correct: `, 880, y + 35)
  ctx.fillText(isHindi ? `गलत उत्तर: ` : `Wrong: `, 880, y + 70)

  // Values (Col 1: 185, Col 2: 700, Col 3: 980)
  setFont(ctx, 'normal', 14)
  ctx.fillText(data.studentName, 185, y + 35)
  ctx.fillText(isHindi ? translateExamToHindi(data.examName) : data.examName, 185, y + 70)
  
  const formattedDate = new Date(data.completedAt).toLocaleDateString(
    isHindi ? 'hi-IN' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  )
  ctx.fillText(formattedDate, 185, y + 105)

  ctx.fillText(`${data.score.toFixed(1)}%`, 700, y + 35)
  ctx.fillText(`${attemptedCount} / ${data.totalQuestions}`, 700, y + 70)
  ctx.fillText(`${unansweredCount}`, 700, y + 105)

  ctx.fillText(`${data.correctAnswers}`, 980, y + 35)
  ctx.fillText(`${wrongCount}`, 980, y + 70)

  y += 170

  // Wrap text helper
  const getWrappedLines = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? currentLine + ' ' + word : word
      setFont(ctx, 'normal', 15) // Use base size for measurements
      const width = ctx.measureText(testLine).width
      if (width < maxWidth) {
        currentLine = testLine
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
    return lines
  }

  // Draw questions loop
  data.questions.forEach((q, idx) => {
    // Prep wrapped lines
    const qText = `${isHindi ? 'प्रश्न' : 'Q'}. ${idx + 1}: ${q.text}`
    const qLines = getWrappedLines(qText, 1080)
    const optALines = getWrappedLines(`(A) ${q.optionA}`, 1050)
    const optBLines = getWrappedLines(`(B) ${q.optionB}`, 1050)
    const optCLines = getWrappedLines(`(C) ${q.optionC}`, 1050)
    const optDLines = getWrappedLines(`(D) ${q.optionD}`, 1050)

    // Calculate height
    // Question text height
    let questionHeight = qLines.length * 24
    // Options height
    let optionsHeight = (optALines.length + optBLines.length + optCLines.length + optDLines.length) * 22 + 20
    // Feedback text height
    let feedbackHeight = 35
    // Margin/Padding
    let totalQHeight = questionHeight + optionsHeight + feedbackHeight + 40

    // Check if it fits on the page
    if (y + totalQHeight > 1580) {
      // Save current page
      pages.push(canvas.toDataURL('image/jpeg', 0.95))
      // Create new page
      canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 1700
      ctx = canvas.getContext('2d')!
      pageCount++
      initPage(pageCount)
      y = 60
    }

    // Draw question box border/bg
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(40, y, 1120, totalQHeight - 15)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.strokeRect(40, y, 1120, totalQHeight - 15)

    let qY = y + 25

    // Draw Question text
    setFont(ctx, 'bold', 15)
    ctx.fillStyle = '#2d3748'
    qLines.forEach((line) => {
      ctx.fillText(line, 60, qY)
      qY += 24
    })

    qY += 5

    // Draw Options
    setFont(ctx, 'normal', 15)
    ctx.fillStyle = '#4a5568'

    const drawOption = (lines: string[], optLetter: string) => {
      const isSelected = q.studentResponse === optLetter
      const isCorrect = q.correctOption === optLetter

      if (isSelected && isCorrect) {
        ctx.fillStyle = '#2f855a' // green
        setFont(ctx, 'bold', 15)
      } else if (isSelected && !isCorrect) {
        ctx.fillStyle = '#c53030' // red
        setFont(ctx, 'bold', 15)
      } else if (isCorrect) {
        ctx.fillStyle = '#2f855a' // highlight correct option text green
        setFont(ctx, 'bold', 15)
      } else {
        ctx.fillStyle = '#4a5568'
        setFont(ctx, 'normal', 15)
      }

      lines.forEach((line) => {
        ctx.fillText(line, 80, qY)
        qY += 22
      })
    }

    drawOption(optALines, 'A')
    drawOption(optBLines, 'B')
    drawOption(optCLines, 'C')
    drawOption(optDLines, 'D')

    qY += 5

    // Draw Feedback box
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(50, qY, 1100, 30)
    
    setFont(ctx, 'bold', 14)
    const isCorrect = q.studentResponse === q.correctOption
    const isUnanswered = !q.studentResponse

    if (isUnanswered) {
      ctx.fillStyle = '#dd6b20' // Orange
      ctx.fillText(
        isHindi 
          ? `अनुत्तरित | सही उत्तर: (${q.correctOption})` 
          : `UNANSWERED | Correct Answer: (${q.correctOption})`,
        60,
        qY + 20
      )
    } else if (isCorrect) {
      ctx.fillStyle = '#2f855a' // Green
      ctx.fillText(
        isHindi 
          ? `सही उत्तर! | आपका उत्तर: (${q.studentResponse})` 
          : `CORRECT! | Your Answer: (${q.studentResponse})`,
        60,
        qY + 20
      )
    } else {
      ctx.fillStyle = '#c53030' // Red
      ctx.fillText(
        isHindi 
          ? `गलत उत्तर! | आपका उत्तर: (${q.studentResponse}) | सही उत्तर: (${q.correctOption})` 
          : `INCORRECT! | Your Answer: (${q.studentResponse}) | Correct Answer: (${q.correctOption})`,
        60,
        qY + 20
      )
    }

    y += totalQHeight
  })

  // Save the final page
  pages.push(canvas.toDataURL('image/jpeg', 0.95))

  // Compile jsPDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  pages.forEach((imgData, index) => {
    if (index > 0) {
      doc.addPage()
    }
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297)
  })

  const suffix = isHindi ? 'उत्तर_पुस्तिका' : 'Answersheet'
  const filename = `${data.studentName.replace(/\s+/g, '_')}_${data.examName.replace(/\s+/g, '_')}_${suffix}.pdf`

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


export async function generateLeaderboardPDF(data: {
  examName: string
  language?: string
  results: Array<{
    rank: number
    studentName: string
    studentMobile?: string
    schoolName: string
    udise?: string
    classroomName: string
    district?: string
    tehsil?: string
    score: number
    correctAnswers: number
    totalQuestions: number
    durationMinutes?: number
    submittedAt?: string | Date
  }>
}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  if (!data.results || data.results.length === 0) {
    return
  }

  const isHindi = data.language === 'hi'
  const letterheadImg = await loadPdfImage(letterheadAsset)

  const fontStack = isHindi 
    ? "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Mangal', 'Segoe UI', system-ui, sans-serif"
    : "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

  const setFont = (ctx: CanvasRenderingContext2D, style: 'normal' | 'bold' | 'italic', size: number) => {
    ctx.font = `${style === 'normal' ? '' : style} ${size}px ${fontStack}`
  }

  const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    if (!text) return ''
    if (ctx.measureText(text).width <= maxWidth) return text
    let truncated = text
    while (truncated.length > 0 && ctx.measureText(truncated + '..').width > maxWidth) {
      truncated = truncated.slice(0, -1)
    }
    return truncated + '..'
  }

  const pages: string[] = []
  let canvas = document.createElement('canvas')
  canvas.width = 1700
  canvas.height = 1200
  let ctx = canvas.getContext('2d')!

  const initPage = (pageNum: number) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1700, 1200)
    
    // Page border
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 3
    ctx.strokeRect(20, 20, 1660, 1160)

    // Page footer
    setFont(ctx, 'normal', 13)
    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'center'
    ctx.fillText(
      isHindi ? `पृष्ठ ${pageNum}` : `Page ${pageNum}`,
      850,
      1160
    )
    ctx.textAlign = 'left'
  }

  const drawTableHeader = (yPos: number) => {
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(30, yPos, 1640, 38)

    setFont(ctx, 'bold', 13)
    ctx.fillStyle = '#ffffff'

    ctx.fillText(isHindi ? 'रैंक' : 'Rank', 45, yPos + 24)
    ctx.fillText(isHindi ? 'छात्र का नाम' : 'Student Name', 135, yPos + 24)
    ctx.fillText(isHindi ? 'मोबाइल' : 'Mobile', 395, yPos + 24)
    ctx.fillText(isHindi ? 'कक्षा' : 'Class', 545, yPos + 24)
    ctx.fillText(isHindi ? 'स्कूल का नाम' : 'School Name', 685, yPos + 24)
    ctx.fillText(isHindi ? 'UDISE' : 'UDISE', 1085, yPos + 24)
    ctx.fillText(isHindi ? 'जिला / तालुका' : 'District / Taluka', 1225, yPos + 24)
    ctx.fillText(isHindi ? 'प्राप्तांक' : 'Score', 1455, yPos + 24)
  }

  let pageCount = 1
  initPage(pageCount)

  // Draw Header on Page 1
  let y = 30
  if (letterheadImg) {
    ctx.drawImage(letterheadImg, 30, y, 1640, 150)
    y += 158

    ctx.fillStyle = '#0b2240'
    ctx.fillRect(30, y, 1640, 36)

    ctx.textAlign = 'center'
    setFont(ctx, 'bold', 14.5)
    ctx.fillStyle = '#f5d782'
    ctx.fillText(
      isHindi ? 'शीर्ष-3 सहभागिता लीडरबोर्ड  |  ऑनलाइन परीक्षा परिणाम एवं योग्यता सूची' : 'TOP-3 PARTICIPATION LEADERBOARD  |  ONLINE EXAMINATION MERIT & RANKING REPORT',
      850,
      y + 24
    )
    ctx.textAlign = 'left'
    y += 46
  } else {
    ctx.fillStyle = '#0b2240'
    ctx.fillRect(30, y, 1640, 65)

    ctx.textAlign = 'center'
    setFont(ctx, 'bold', 22)
    ctx.fillStyle = '#f5d782'
    ctx.fillText(
      isHindi ? 'भारत विकास परिषद - शीर्ष-3 सहभागिता लीडरबोर्ड' : 'BHARAT VIKAS PARISHAD - TOP-3 PARTICIPATION LEADERBOARD',
      850,
      y + 36
    )
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(
      isHindi ? 'ऑनलाइन परीक्षा परिणाम एवं योग्यता सूची' : 'Online Examination Merit & Ranking Report',
      850,
      y + 54
    )
    ctx.textAlign = 'left'
    y += 75
  }

  // Draw Metadata Box on Page 1
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(30, y, 1640, 44)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.strokeRect(30, y, 1640, 44)

  const formattedDate = new Date().toLocaleDateString(
    isHindi ? 'hi-IN' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  )

  setFont(ctx, 'bold', 12.5)
  ctx.fillStyle = '#1e293b'
  ctx.fillText(isHindi ? 'परीक्षा: ' : 'Exam: ', 50, y + 28)
  setFont(ctx, 'normal', 12.5)
  ctx.fillStyle = '#334155'
  ctx.fillText(data.examName, 100, y + 28)

  setFont(ctx, 'bold', 12.5)
  ctx.fillStyle = '#1e293b'
  ctx.fillText(isHindi ? 'दिनांक: ' : 'Generated On: ', 700, y + 28)
  setFont(ctx, 'normal', 12.5)
  ctx.fillStyle = '#334155'
  ctx.fillText(formattedDate, 815, y + 28)

  setFont(ctx, 'bold', 12.5)
  ctx.fillStyle = '#1e293b'
  ctx.fillText(isHindi ? 'कुल प्रतिभागी: ' : 'Total Ranked Candidates: ', 1280, y + 28)
  setFont(ctx, 'bold', 13)
  ctx.fillStyle = '#0b2240'
  ctx.fillText(`${data.results.length}`, 1485, y + 28)

  y += 56

  // Draw initial Table Header
  drawTableHeader(y)
  y += 38

  // Draw Table Rows
  const rowHeight = 34
  data.results.forEach((r, idx) => {
    // Check if new page is needed
    if (y + rowHeight > 1130) {
      pages.push(canvas.toDataURL('image/jpeg', 0.95))
      canvas = document.createElement('canvas')
      canvas.width = 1700
      canvas.height = 1200
      ctx = canvas.getContext('2d')!
      pageCount++
      initPage(pageCount)
      
      y = 40
      drawTableHeader(y)
      y += 38
    }

    // Row Background (Zebra Striping)
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
    ctx.fillRect(30, y, 1640, rowHeight)

    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.strokeRect(30, y, 1640, rowHeight)

    // Rank Badge
    const rankY = y + 22
    if (r.rank === 1) {
      ctx.fillStyle = '#d4af37' // Gold
      ctx.fillRect(40, y + 6, 75, 22)
      setFont(ctx, 'bold', 11)
      ctx.fillStyle = '#ffffff'
      ctx.fillText('🥇 1st', 52, rankY)
    } else if (r.rank === 2) {
      ctx.fillStyle = '#94a3b8' // Silver
      ctx.fillRect(40, y + 6, 75, 22)
      setFont(ctx, 'bold', 11)
      ctx.fillStyle = '#ffffff'
      ctx.fillText('🥈 2nd', 52, rankY)
    } else if (r.rank === 3) {
      ctx.fillStyle = '#cd7f32' // Bronze
      ctx.fillRect(40, y + 6, 75, 22)
      setFont(ctx, 'bold', 11)
      ctx.fillStyle = '#ffffff'
      ctx.fillText('🥉 3rd', 52, rankY)
    } else {
      setFont(ctx, 'bold', 12)
      ctx.fillStyle = '#475569'
      ctx.fillText(`${r.rank}th`, 55, rankY)
    }

    // Student Name
    setFont(ctx, 'bold', 12.5)
    ctx.fillStyle = '#0f172a'
    const studentNameTruncated = truncateText(ctx, r.studentName, 240)
    ctx.fillText(studentNameTruncated, 135, rankY)

    // Mobile
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#475569'
    ctx.fillText(r.studentMobile || '-', 395, rankY)

    // Class
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#334155'
    const classTruncated = truncateText(ctx, r.classroomName || '-', 130)
    ctx.fillText(classTruncated, 545, rankY)

    // School Name
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#1e293b'
    const schoolTruncated = truncateText(ctx, r.schoolName || '-', 380)
    ctx.fillText(schoolTruncated, 685, rankY)

    // UDISE
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#475569'
    ctx.fillText(r.udise || '-', 1085, rankY)

    // District / Taluka
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#334155'
    const geoText = [r.district, r.tehsil].filter(Boolean).join(', ') || '-'
    const geoTruncated = truncateText(ctx, geoText, 210)
    ctx.fillText(geoTruncated, 1225, rankY)

    // Score & Marks
    setFont(ctx, 'bold', 12.5)
    ctx.fillStyle = '#1e3a8a'
    const scoreText = `${r.score} pts (${r.correctAnswers}/${r.totalQuestions})`
    ctx.fillText(scoreText, 1455, rankY)

    y += rowHeight
  })

  // Save the final page
  pages.push(canvas.toDataURL('image/jpeg', 0.95))

  // Compile jsPDF document (Landscape A4)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  pages.forEach((imgData, index) => {
    if (index > 0) {
      doc.addPage()
    }
    doc.addImage(imgData, 'JPEG', 0, 0, 297, 210)
  })

  const cleanExamName = data.examName.replace(/\s+/g, '_')
  const filename = `${cleanExamName}_Top3_Leaderboard.pdf`

  if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
    try {
      const pdfDataUri = doc.output('datauristring')
      ;(window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'DOWNLOAD_PDF',
        pdfData: pdfDataUri,
        filename
      }))
    } catch (err) {
      doc.save(filename)
    }
  } else {
    doc.save(filename)
  }
}

export interface SchoolReportPDFParams {
  schoolName: string
  udise: string
  district?: string
  tehsil?: string
  filterExam?: string
  filterGroup?: string
  filterClassroom?: string
  language?: string
  reportType?: 'RANKINGS' | 'ATTEMPTS'
  results: Array<{
    rank?: number
    studentName: string
    studentMobile?: string
    classroomName?: string
    examName?: string
    score: number
    correctAnswers?: number
    totalQuestions?: number
    durationMinutes?: number
    submittedAt?: string
    completed?: boolean
  }>
}

export async function generateSchoolReportPDF(data: SchoolReportPDFParams) {
  const isHindi = data.language === 'hi'
  const isRankings = data.reportType !== 'ATTEMPTS'
  const letterheadImg = await loadPdfImage(letterheadAsset)

  const fontStack = isHindi 
    ? "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Mangal', 'Segoe UI', system-ui, sans-serif"
    : "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

  const setFont = (ctx: CanvasRenderingContext2D, style: 'normal' | 'bold' | 'italic', size: number) => {
    ctx.font = `${style === 'normal' ? '' : style} ${size}px ${fontStack}`
  }

  const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    if (!text) return ''
    if (ctx.measureText(text).width <= maxWidth) return text
    let truncated = text
    while (truncated.length > 0 && ctx.measureText(truncated + '..').width > maxWidth) {
      truncated = truncated.slice(0, -1)
    }
    return truncated + '..'
  }

  const pages: string[] = []
  let canvas = document.createElement('canvas')
  canvas.width = 1700
  canvas.height = 1200
  let ctx = canvas.getContext('2d')!

  const initPage = (pageNum: number) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1700, 1200)
    
    // Page border
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 3
    ctx.strokeRect(20, 20, 1660, 1160)

    // Page footer
    setFont(ctx, 'normal', 13)
    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'center'
    ctx.fillText(
      isHindi ? `पृष्ठ ${pageNum}` : `Page ${pageNum}`,
      850,
      1160
    )
    ctx.textAlign = 'left'
  }

  const drawTableHeader = (yPos: number) => {
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(30, yPos, 1640, 38)

    setFont(ctx, 'bold', 13)
    ctx.fillStyle = '#ffffff'

    if (isRankings) {
      ctx.fillText(isHindi ? 'रैंक' : 'Rank', 45, yPos + 24)
      ctx.fillText(isHindi ? 'छात्र का नाम' : 'Student Name', 140, yPos + 24)
      ctx.fillText(isHindi ? 'मोबाइल' : 'Mobile', 430, yPos + 24)
      ctx.fillText(isHindi ? 'कक्षा' : 'Class', 600, yPos + 24)
      ctx.fillText(isHindi ? 'परीक्षा' : 'Exam Name', 750, yPos + 24)
      ctx.fillText(isHindi ? 'प्राप्तांक' : 'Score / Marks', 1100, yPos + 24)
      ctx.fillText(isHindi ? 'समय' : 'Duration', 1310, yPos + 24)
      ctx.fillText(isHindi ? 'जमा करने की तिथि' : 'Submission Date', 1450, yPos + 24)
    } else {
      ctx.fillText(isHindi ? 'क्र.' : 'Sr.', 45, yPos + 24)
      ctx.fillText(isHindi ? 'छात्र का नाम' : 'Student Name', 140, yPos + 24)
      ctx.fillText(isHindi ? 'मोबाइल' : 'Mobile', 430, yPos + 24)
      ctx.fillText(isHindi ? 'कक्षा' : 'Class', 600, yPos + 24)
      ctx.fillText(isHindi ? 'परीक्षा' : 'Exam Name', 750, yPos + 24)
      ctx.fillText(isHindi ? 'प्राप्तांक' : 'Score / Marks', 1100, yPos + 24)
      ctx.fillText(isHindi ? 'स्थिति' : 'Status', 1310, yPos + 24)
      ctx.fillText(isHindi ? 'दिनांक' : 'Date', 1450, yPos + 24)
    }
  }

  let pageCount = 1
  initPage(pageCount)

  // Draw Header on Page 1
  let y = 30
  if (letterheadImg) {
    ctx.drawImage(letterheadImg, 30, y, 1640, 150)
    y += 158

    ctx.fillStyle = '#0b2240'
    ctx.fillRect(30, y, 1640, 48)

    ctx.textAlign = 'center'
    setFont(ctx, 'bold', 16)
    ctx.fillStyle = '#f5d782' // Gold Title
    const schoolDisplayTitle = `${data.schoolName.toUpperCase()} - ${isRankings ? (isHindi ? 'लाइव रैंकिंग रिपोर्ट' : 'STUDENT RANKINGS REPORT') : (isHindi ? 'परीक्षा प्रयास रिपोर्ट' : 'EXAM ATTEMPTS REPORT')}`
    ctx.fillText(
      truncateText(ctx, schoolDisplayTitle, 1550),
      850,
      y + 24
    )
    setFont(ctx, 'normal', 11.5)
    ctx.fillStyle = '#e2e8f0'
    const locParts = [`UDISE: ${data.udise}`]
    if (data.tehsil) locParts.push(`${isHindi ? 'तहसील' : 'Tehsil'}: ${data.tehsil}`)
    if (data.district) locParts.push(`${isHindi ? 'जिला' : 'District'}: ${data.district}`)
    ctx.fillText(
      locParts.join('  |  '),
      850,
      y + 40
    )
    ctx.textAlign = 'left'
    y += 56
  } else {
    ctx.fillStyle = '#0b2240' // Dark Navy Banner
    ctx.fillRect(30, y, 1640, 68)

    ctx.textAlign = 'center'
    setFont(ctx, 'bold', 20)
    ctx.fillStyle = '#f5d782' // Gold Title
    const schoolDisplayTitle = `${data.schoolName.toUpperCase()} - ${isRankings ? (isHindi ? 'लाइव रैंकिंग रिपोर्ट' : 'STUDENT RANKINGS REPORT') : (isHindi ? 'परीक्षा प्रयास रिपोर्ट' : 'EXAM ATTEMPTS REPORT')}`
    ctx.fillText(
      truncateText(ctx, schoolDisplayTitle, 1550),
      850,
      y + 34
    )
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#e2e8f0'
    const locParts = [`UDISE: ${data.udise}`]
    if (data.tehsil) locParts.push(`${isHindi ? 'तहसील' : 'Tehsil'}: ${data.tehsil}`)
    if (data.district) locParts.push(`${isHindi ? 'जिला' : 'District'}: ${data.district}`)
    ctx.fillText(
      locParts.join('  |  '),
      850,
      y + 55
    )
    ctx.textAlign = 'left'
    y += 78
  }

  // Draw Metadata Box on Page 1
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(30, y, 1640, 46)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.strokeRect(30, y, 1640, 46)

  const formattedDate = new Date().toLocaleDateString(
    isHindi ? 'hi-IN' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  )

  setFont(ctx, 'bold', 12.5)
  ctx.fillStyle = '#1e293b'
  ctx.fillText(isHindi ? 'परीक्षा: ' : 'Exam: ', 45, y + 28)
  setFont(ctx, 'normal', 12.5)
  ctx.fillStyle = '#334155'
  ctx.fillText(truncateText(ctx, data.filterExam || (isHindi ? 'सभी परीक्षाएं' : 'All Exams'), 220), 100, y + 28)

  setFont(ctx, 'bold', 12.5)
  ctx.fillStyle = '#1e293b'
  ctx.fillText(isHindi ? 'कक्षा: ' : 'Class: ', 360, y + 28)
  setFont(ctx, 'normal', 12.5)
  ctx.fillStyle = '#334155'
  ctx.fillText(truncateText(ctx, data.filterClassroom || (isHindi ? 'सभी कक्षाएं' : 'All Classrooms'), 180), 415, y + 28)

  setFont(ctx, 'bold', 12.5)
  ctx.fillStyle = '#1e293b'
  ctx.fillText(isHindi ? 'दिनांक: ' : 'Generated: ', 680, y + 28)
  setFont(ctx, 'normal', 12.5)
  ctx.fillStyle = '#334155'
  ctx.fillText(formattedDate, 765, y + 28)

  setFont(ctx, 'bold', 12.5)
  ctx.fillStyle = '#1e293b'
  ctx.fillText(isHindi ? 'कुल रिकॉर्ड: ' : 'Total Records: ', 1350, y + 28)
  setFont(ctx, 'bold', 13)
  ctx.fillStyle = '#0b2240'
  ctx.fillText(`${data.results.length}`, 1480, y + 28)

  y += 58

  // Draw initial Table Header
  drawTableHeader(y)
  y += 38

  // Draw Table Rows
  const rowHeight = 34
  data.results.forEach((r, idx) => {
    // Check if new page is needed
    if (y + rowHeight > 1130) {
      pages.push(canvas.toDataURL('image/jpeg', 0.95))
      canvas = document.createElement('canvas')
      canvas.width = 1700
      canvas.height = 1200
      ctx = canvas.getContext('2d')!
      pageCount++
      initPage(pageCount)
      
      y = 40
      drawTableHeader(y)
      y += 38
    }

    // Row Background (Zebra Striping)
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
    ctx.fillRect(30, y, 1640, rowHeight)

    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.strokeRect(30, y, 1640, rowHeight)

    const rankY = y + 22

    if (isRankings) {
      // Rank Badge
      const currentRank = r.rank !== undefined ? r.rank : idx + 1
      if (currentRank === 1) {
        ctx.fillStyle = '#d4af37' // Gold
        ctx.fillRect(40, y + 6, 75, 22)
        setFont(ctx, 'bold', 11)
        ctx.fillStyle = '#ffffff'
        ctx.fillText('🥇 1st', 52, rankY)
      } else if (currentRank === 2) {
        ctx.fillStyle = '#94a3b8' // Silver
        ctx.fillRect(40, y + 6, 75, 22)
        setFont(ctx, 'bold', 11)
        ctx.fillStyle = '#ffffff'
        ctx.fillText('🥈 2nd', 52, rankY)
      } else if (currentRank === 3) {
        ctx.fillStyle = '#cd7f32' // Bronze
        ctx.fillRect(40, y + 6, 75, 22)
        setFont(ctx, 'bold', 11)
        ctx.fillStyle = '#ffffff'
        ctx.fillText('🥉 3rd', 52, rankY)
      } else {
        setFont(ctx, 'bold', 12)
        ctx.fillStyle = '#475569'
        ctx.fillText(`${currentRank}th`, 55, rankY)
      }
    } else {
      setFont(ctx, 'bold', 12)
      ctx.fillStyle = '#475569'
      ctx.fillText(`${idx + 1}`, 50, rankY)
    }

    // Student Name
    setFont(ctx, 'bold', 12.5)
    ctx.fillStyle = '#0f172a'
    const studentNameTruncated = truncateText(ctx, r.studentName, 260)
    ctx.fillText(studentNameTruncated, 140, rankY)

    // Mobile
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#475569'
    ctx.fillText(r.studentMobile || '-', 430, rankY)

    // Class
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#334155'
    const classTruncated = truncateText(ctx, r.classroomName || '-', 130)
    ctx.fillText(classTruncated, 600, rankY)

    // Exam Name
    setFont(ctx, 'normal', 12)
    ctx.fillStyle = '#1e293b'
    const examTruncated = truncateText(ctx, r.examName || '-', 320)
    ctx.fillText(examTruncated, 750, rankY)

    // Score & Marks
    setFont(ctx, 'bold', 12.5)
    ctx.fillStyle = '#1e3a8a'
    let scoreDisplay = `${r.score} marks`
    if (r.correctAnswers !== undefined && r.totalQuestions !== undefined && r.totalQuestions > 0) {
      scoreDisplay = `${r.score} marks (${r.correctAnswers}/${r.totalQuestions})`
    }
    ctx.fillText(scoreDisplay, 1100, rankY)

    if (isRankings) {
      // Duration
      setFont(ctx, 'normal', 12)
      ctx.fillStyle = '#475569'
      const durText = r.durationMinutes ? `${r.durationMinutes} min` : '-'
      ctx.fillText(durText, 1310, rankY)

      // Submission Date
      setFont(ctx, 'normal', 11.5)
      ctx.fillStyle = '#475569'
      const dateText = r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '-'
      ctx.fillText(dateText, 1450, rankY)
    } else {
      // Status
      setFont(ctx, 'bold', 11.5)
      if (r.completed) {
        ctx.fillStyle = '#16a34a'
        ctx.fillText(isHindi ? 'पूर्ण' : 'Completed', 1310, rankY)
      } else {
        ctx.fillStyle = '#d97706'
        ctx.fillText(isHindi ? 'प्रगति पर' : 'In Progress', 1310, rankY)
      }

      // Date
      setFont(ctx, 'normal', 11.5)
      ctx.fillStyle = '#475569'
      const dateText = r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '-'
      ctx.fillText(dateText, 1450, rankY)
    }

    y += rowHeight
  })

  // Save the final page
  pages.push(canvas.toDataURL('image/jpeg', 0.95))

  // Compile jsPDF document (Landscape A4)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  pages.forEach((imgData, index) => {
    if (index > 0) {
      doc.addPage()
    }
    doc.addImage(imgData, 'JPEG', 0, 0, 297, 210)
  })

  const cleanSchool = data.schoolName.replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_').substring(0, 30)
  const reportTag = isRankings ? 'Rankings' : 'Attempts'
  const filename = `${cleanSchool}_${data.udise}_${reportTag}.pdf`

  if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
    try {
      const pdfDataUri = doc.output('datauristring')
      ;(window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'DOWNLOAD_PDF',
        pdfData: pdfDataUri,
        filename
      }))
    } catch (err) {
      doc.save(filename)
    }
  } else {
    doc.save(filename)
  }
}


