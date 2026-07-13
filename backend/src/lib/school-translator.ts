import { prisma } from './prisma'

// Predefined translation maps
const DISTRICT_MAP: { [key: string]: string } = {
  ahmednagar: 'अहमदनगर',
  pune: 'पुणे',
  nashik: 'नाशिक',
  mumbai: 'मुंबई',
  aurangabad: 'औरंगाबाद',
  'chhatrapati sambhajinagar': 'छत्रपति संभाजीनगर',
  thane: 'ठाणे',
  nagpur: 'नागपुर',
  solapur: 'सोलापूर',
  kolhapur: 'कोल्हापूर',
  jalgaon: 'जळगाव',
  sangli: 'सांगली',
  satara: 'सातारा',
  amravati: 'अमरावती',
  nanded: 'नांदेड',
}

const TEHSIL_MAP: { [key: string]: string } = {
  sangamner: 'संगमनेर',
  akole: 'अकोले',
  kopargaon: 'कोपरगांव',
  rahata: 'रहाता',
  shrirampur: 'श्रीरामपुर',
  nevasa: 'नेवासा',
  shevgaon: 'शेवगांव',
  pathardi: 'पाथर्डी',
  nagar: 'नगर',
  rahuri: 'राहुरी',
  parner: 'पारनेर',
  shrigonda: 'श्रीगोंदा',
  karjat: 'कर्जत',
  jamkhed: 'जामखेड',
  haveli: 'हवेली',
  maval: 'मावल',
  mulshi: 'मुळशी',
  bhor: 'भोर',
  velhe: 'वेल्हे',
  junnar: 'जुन्नर',
  ambegaon: 'आंबेगाव',
  khed: 'खेड',
  shirur: 'शिरूर',
  daund: 'दौंड',
  indapur: 'इंदापूर',
  baramati: 'बारामती',
  purandar: 'पुरंदर',
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
}

// Helper to translate a word or name to Hindi
function translateText(text: string, mapToUse: { [key: string]: string }): string {
  const cleaned = text.trim().toLowerCase()
  if (mapToUse[cleaned]) {
    return mapToUse[cleaned]
  }
  return text
}

// Smart translation for School Name
function translateSchoolName(name: string): string {
  let lower = name.toLowerCase().trim()
  if (lower === 'new era academy') return 'न्यू एरा अकादमी'
  if (lower === 'new era school') return 'न्यू एरा स्कूल'

  // Replace common multi-word strings first
  let translated = name
  const multiWords = ['high school', 'junior college', 'english medium', 'zilla parishad']
  for (const mw of multiWords) {
    if (lower.includes(mw)) {
      const regex = new RegExp(`\\b${mw}\\b`, 'gi')
      translated = translated.replace(regex, SCHOOL_WORD_MAP[mw])
    }
  }

  // Tokenize and replace individual keywords
  const tokens = translated.split(/\s+/)
  const mappedTokens = tokens.map(token => {
    const cleanToken = token.toLowerCase().replace(/[^a-z0-9.]/g, '')
    if (SCHOOL_WORD_MAP[cleanToken]) {
      return SCHOOL_WORD_MAP[cleanToken]
    }
    // Basic transliteration for common names if unmatched
    if (cleanToken === 'new') return 'न्यू'
    if (cleanToken === 'era') return 'एरा'
    if (cleanToken === 'pune') return 'पुणे'
    if (cleanToken === 'nashik') return 'नाशिक'
    if (cleanToken === 'mumbai') return 'मुंबई'
    return token
  })

  return mappedTokens.join(' ')
}

export async function upsertSchoolTranslation(schoolId: string, name: string, tehsil: string | null, district: string | null) {
  try {
    const school = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!school) return

    const hindiName = translateSchoolName(name)
    const hindiTehsil = tehsil ? translateText(tehsil, TEHSIL_MAP) : null
    const hindiDistrict = district ? translateText(district, DISTRICT_MAP) : null

    await prisma.school.upsert({
      where: {
        udise_language: {
          udise: school.udise,
          language: 'hi',
        },
      },
      update: {
        name: hindiName,
        tehsil: hindiTehsil,
        district: hindiDistrict,
      },
      create: {
        udise: school.udise,
        language: 'hi',
        name: hindiName,
        tehsil: hindiTehsil,
        district: hindiDistrict,
        adminId: school.adminId,
        questionSetName: school.questionSetName,
      },
    })
  } catch (error) {
    console.error(`Failed to upsert school translation for schoolId: ${schoolId}`, error)
  }
}
