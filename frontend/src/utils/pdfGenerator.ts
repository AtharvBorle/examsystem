import { jsPDF } from 'jspdf'
import certificateBg from '../assets/Certificatebackground.jpg'
import englishCertBg from '../assets/english.png'
import hindiCertBg from '../assets/hindi.png'
import letterheadAsset from '../assets/letterhead.png'

const loadPdfImage = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    if (!src.startsWith('data:') && !src.startsWith('file:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => {
      // In WebView or local file protocol, crossOrigin may trigger security errors; retry without crossOrigin
      if (img.crossOrigin) {
        const retryImg = new Image()
        retryImg.onload = () => resolve(retryImg)
        retryImg.onerror = () => resolve(null)
        retryImg.src = src
        return
      }
      resolve(null)
    }
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

function formatClassForEnglish(name: string): string {
  if (!name) return ''
  const cleaned = name.trim()
  const numMatch = cleaned.match(/(12|11|10|[1-9])/)
  const romanMatch = cleaned.match(/\b(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/i)
  const ROMAN: { [k: string]: number } = { xii: 12, xi: 11, x: 10, ix: 9, viii: 8, vii: 7, vi: 6, v: 5, iv: 4, iii: 3, ii: 2, i: 1 }
  const num = numMatch ? parseInt(numMatch[1]) : (romanMatch ? ROMAN[romanMatch[1].toLowerCase()] : null)
  if (num) {
    const ordinals: { [k: number]: string } = {
      1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th',
      6: '6th', 7: '7th', 8: '8th', 9: '9th', 10: '10th',
      11: '11th', 12: '12th'
    }
    let res = ordinals[num] || `${num}th`
    const secMatch = cleaned.match(/\b([A-D])\b/i)
    if (secMatch) {
      res += ` ${secMatch[1].toUpperCase()}`
    }
    return res
  }
  return cleaned.replace(/^(class|classroom|grade)\s*/gi, '').trim() || cleaned
}

function formatClassForHindi(name: string): string {
  if (!name) return ''
  const cleaned = name.trim()
  const numMatch = cleaned.match(/(12|11|10|[1-9])/)
  const romanMatch = cleaned.match(/\b(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/i)
  const ROMAN: { [k: string]: number } = { xii: 12, xi: 11, x: 10, ix: 9, viii: 8, vii: 7, vi: 6, v: 5, iv: 4, iii: 3, ii: 2, i: 1 }
  const num = numMatch ? parseInt(numMatch[1]) : (romanMatch ? ROMAN[romanMatch[1].toLowerCase()] : null)
  if (num) {
    const HINDI_ORDINALS: { [k: number]: string } = {
      1: '1ली', 2: '2री', 3: '3री', 4: '4थी', 5: '5वीं',
      6: '6ठी', 7: '7वीं', 8: '8वीं', 9: '9वीं', 10: '10वीं',
      11: '11वीं', 12: '12वीं'
    }
    let res = HINDI_ORDINALS[num] || `${num}वीं`
    const secMatch = cleaned.match(/\b([A-D])\b/i)
    if (secMatch) {
      const s = secMatch[1].toUpperCase()
      const hiSec = s === 'A' ? 'ए' : s === 'B' ? 'बी' : s === 'C' ? 'सी' : 'डी'
      res += ` - ${hiSec}`
    }
    return res
  }
  return cleaned.replace(/(कक्षा|क्लास)/gi, '').trim() || cleaned
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

  // Create canvas exactly matching template dimensions (2000 x 1414)
  const canvas = document.createElement('canvas')
  canvas.width = 2000
  canvas.height = 1414
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const isHindi = data.language === 'hi'
  const primaryBg = isHindi ? hindiCertBg : englishCertBg
  const fallbackBgUrl = isHindi ? '/hindi.png' : '/english.png'

  let bgImg = await loadPdfImage(primaryBg)
  if (!bgImg) {
    bgImg = await loadPdfImage(fallbackBgUrl)
  }

  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, 2000, 1414)
  } else {
    console.error('Failed to load certificate template image')
    ctx.fillStyle = '#f7f4ee'
    ctx.fillRect(0, 0, 2000, 1414)
  }

  const fontStack = isHindi 
    ? "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Mangal', 'Segoe UI', system-ui, sans-serif"
    : "'Segoe UI', Arial, system-ui, sans-serif"

  // 1. Dynamic Branch Name (Line 2)
  // Both templates have default branch ('Siddheshwar Shakha, Latur' / 'सिद्धेश्वर शाखा, लातूर') baked in.
  // If the admin configured a custom branch that differs, seamlessly patch Line 2 using parchment texture.
  const rawBranch = (data.branch || '').trim()
  const cleanedBranch = isHindi 
    ? rawBranch.replace(/^भारत विकास परिषद\s*/g, '').trim()
    : rawBranch.replace(/^Bharat Vikas Parishad\s*/gi, '').trim()

  const defaultBranchEn = 'siddheshwar shakha, latur'
  const defaultBranchHi = 'सिद्धेश्वर शाखा, लातूर'
  const isBranchCustom = cleanedBranch && 
    cleanedBranch.toLowerCase() !== defaultBranchEn && 
    cleanedBranch.toLowerCase() !== defaultBranchHi &&
    !cleanedBranch.toLowerCase().startsWith('siddheshwar') &&
    !cleanedBranch.startsWith('सिद्धेश्वर')

  if (isBranchCustom) {
    try {
      ctx.drawImage(canvas, 550, 325, 900, 55, 550, 226, 900, 55)
    } catch (e) {
      // ignore
    }
    let branchSize = isHindi ? 36 : 38
    ctx.font = `bold ${branchSize}px ${fontStack}`
    ctx.fillStyle = '#2b2b2b'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    while (ctx.measureText(cleanedBranch).width > 850 && branchSize > 20) {
      branchSize -= 2
      ctx.font = `bold ${branchSize}px ${fontStack}`
    }
    ctx.fillText(cleanedBranch, 1000, 252)
  }

  // 2. Student Name (Line 6) - Includes mother name
  if (data.studentName) {
    let nameSize = isHindi ? 42 : 40
    ctx.font = `bold ${nameSize}px ${fontStack}`
    ctx.fillStyle = '#111827'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    while (ctx.measureText(data.studentName).width > 900 && nameSize > 20) {
      nameSize -= 2
      ctx.font = `bold ${nameSize}px ${fontStack}`
    }
    ctx.fillText(data.studentName, 1000, 648)
  }

  // 3. Class (Line 7)
  if (isHindi) {
    const displayClass = formatClassForHindi(data.classroomName || '')
    if (displayClass) {
      let classSize = 27
      ctx.font = `bold ${classSize}px ${fontStack}`
      ctx.fillStyle = '#111827'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      while (ctx.measureText(displayClass).width > 75 && classSize > 16) {
        classSize -= 2
        ctx.font = `bold ${classSize}px ${fontStack}`
      }
      ctx.fillText(displayClass, 982, 712)
    }
  } else {
    const displayClass = formatClassForEnglish(data.classroomName || '')
    if (displayClass) {
      let classSize = 28
      ctx.font = `bold ${classSize}px ${fontStack}`
      ctx.fillStyle = '#111827'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      while (ctx.measureText(displayClass).width > 65 && classSize > 16) {
        classSize -= 2
        ctx.font = `bold ${classSize}px ${fontStack}`
      }
      ctx.fillText(displayClass, 1052, 714)
    }
  }

  // 4. School Name (Line 8)
  const displaySchool = isHindi 
    ? (translateSchoolToHindi(data.schoolName || '') || cleanedBranch || '') 
    : (data.schoolName || cleanedBranch || '')

  if (displaySchool) {
    let schoolSize = isHindi ? 34 : 33
    ctx.font = `bold ${schoolSize}px ${fontStack}`
    ctx.fillStyle = '#111827'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    while (ctx.measureText(displaySchool).width > 850 && schoolSize > 18) {
      schoolSize -= 2
      ctx.font = `bold ${schoolSize}px ${fontStack}`
    }
    ctx.fillText(displaySchool, 1000, 778.5)
  }

  // 5. Taluka & District (Line 9)
  if (isHindi) {
    const displayTehsil = translateGeography(data.tehsil || '', true)
    const displayDistrict = translateGeography(data.district || '', true)

    ctx.fillStyle = '#111827'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    if (displayTehsil) {
      let tSize = 30
      ctx.font = `bold ${tSize}px ${fontStack}`
      while (ctx.measureText(displayTehsil).width > 160 && tSize > 18) {
        tSize -= 2
        ctx.font = `bold ${tSize}px ${fontStack}`
      }
      ctx.fillText(displayTehsil, 948, 835)
    }

    if (displayDistrict) {
      let dSize = 30
      ctx.font = `bold ${dSize}px ${fontStack}`
      while (ctx.measureText(displayDistrict).width > 160 && dSize > 18) {
        dSize -= 2
        ctx.font = `bold ${dSize}px ${fontStack}`
      }
      ctx.fillText(displayDistrict, 1238, 835)
    }
  } else {
    const displayTehsil = translateGeography(data.tehsil || '', false)
    const displayDistrict = translateGeography(data.district || '', false)

    ctx.fillStyle = '#111827'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    if (displayTehsil) {
      let tSize = 30
      ctx.font = `bold ${tSize}px ${fontStack}`
      while (ctx.measureText(displayTehsil).width > 155 && tSize > 18) {
        tSize -= 2
        ctx.font = `bold ${tSize}px ${fontStack}`
      }
      ctx.fillText(displayTehsil, 935, 841.5)
    }

    if (displayDistrict) {
      let dSize = 30
      ctx.font = `bold ${dSize}px ${fontStack}`
      while (ctx.measureText(displayDistrict).width > 155 && dSize > 18) {
        dSize -= 2
        ctx.font = `bold ${dSize}px ${fontStack}`
      }
      ctx.fillText(displayDistrict, 1245, 841.5)
    }
  }

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
  periodText?: string
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
    const imgWidth = 1640
    const naturalW = letterheadImg.naturalWidth || letterheadImg.width || 2172
    const naturalH = letterheadImg.naturalHeight || letterheadImg.height || 724
    const imgAspect = naturalW / naturalH
    const imgHeight = Math.round(imgWidth / imgAspect)

    ctx.drawImage(letterheadImg, 30, y, imgWidth, imgHeight)
    y += imgHeight + 14

    ctx.fillStyle = '#0b2240'
    ctx.fillRect(30, y, 1640, 36)

    ctx.textAlign = 'center'
    setFont(ctx, 'bold', 14.5)
    ctx.fillStyle = '#f5d782'
    ctx.fillText(
      isHindi ? 'लीडरबोर्ड  |  ऑनलाइन परीक्षा परिणाम एवं योग्यता सूची' : 'LEADERBOARD  |  ONLINE EXAMINATION MERIT & RANKING REPORT',
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
      isHindi ? 'भारत विकास परिषद - लीडरबोर्ड' : 'BHARAT VIKAS PARISHAD - LEADERBOARD',
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
  ctx.fillText(truncateText(ctx, data.examName, data.periodText ? 400 : 550), 100, y + 28)

  if (data.periodText) {
    setFont(ctx, 'bold', 12.5)
    ctx.fillStyle = '#1e293b'
    ctx.fillText(isHindi ? 'समयावधि: ' : 'Period: ', 550, y + 28)
    setFont(ctx, 'normal', 12.5)
    ctx.fillStyle = '#334155'
    ctx.fillText(data.periodText, isHindi ? 625 : 615, y + 28)
  }

  setFont(ctx, 'bold', 12.5)
  ctx.fillStyle = '#1e293b'
  ctx.fillText(isHindi ? 'दिनांक: ' : 'Generated On: ', data.periodText ? 820 : 700, y + 28)
  setFont(ctx, 'normal', 12.5)
  ctx.fillStyle = '#334155'
  ctx.fillText(formattedDate, data.periodText ? 935 : 815, y + 28)

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
  const periodSlug = data.periodText ? `_${data.periodText.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_')}` : ''
  const filename = `${cleanExamName}_Leaderboard${periodSlug}.pdf`

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
    const imgWidth = 1640
    const naturalW = letterheadImg.naturalWidth || letterheadImg.width || 2172
    const naturalH = letterheadImg.naturalHeight || letterheadImg.height || 724
    const imgAspect = naturalW / naturalH
    const imgHeight = Math.round(imgWidth / imgAspect)

    ctx.drawImage(letterheadImg, 30, y, imgWidth, imgHeight)
    y += imgHeight + 14

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
    y += 58
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


