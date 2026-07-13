const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Predefined translation maps
const DISTRICT_MAP = {
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

const TEHSIL_MAP = {
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
  purandar: 'पुरेंडर',
}

const SCHOOL_WORD_MAP = {
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

function translateSchoolName(name) {
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
    if (cleanToken === 'new') return 'न्यू'
    if (cleanToken === 'era') return 'एरा'
    if (cleanToken === 'pune') return 'पुणे'
    if (cleanToken === 'nashik') return 'नाशिक'
    if (cleanToken === 'mumbai') return 'मुंबई'
    return token
  })

  return mappedTokens.join(' ')
}

async function main() {
  console.log('Starting migration...')
  const schools = await prisma.school.findMany()
  console.log(`Found ${schools.length} schools to migrate.`)

  for (const school of schools) {
    console.log(`Migrating school: ${school.name} (UDISE: ${school.udise})`)

    // 1. English Translation
    await prisma.schoolTranslation.upsert({
      where: {
        schoolId_language: {
          schoolId: school.id,
          language: 'en',
        },
      },
      update: {
        name: school.name,
        tehsil: school.tehsil,
        district: school.district,
      },
      create: {
        schoolId: school.id,
        language: 'en',
        name: school.name,
        tehsil: school.tehsil,
        district: school.district,
      },
    })

    // 2. Hindi Translation
    const hindiName = translateSchoolName(school.name)
    const tehsilLower = school.tehsil ? school.tehsil.trim().toLowerCase() : ''
    const hindiTehsil = DISTRICT_MAP[tehsilLower] || TEHSIL_MAP[tehsilLower] || school.tehsil
    const districtLower = school.district ? school.district.trim().toLowerCase() : ''
    const hindiDistrict = DISTRICT_MAP[districtLower] || school.district

    await prisma.schoolTranslation.upsert({
      where: {
        schoolId_language: {
          schoolId: school.id,
          language: 'hi',
        },
      },
      update: {
        name: hindiName,
        tehsil: hindiTehsil,
        district: hindiDistrict,
      },
      create: {
        schoolId: school.id,
        language: 'hi',
        name: hindiName,
        tehsil: hindiTehsil,
        district: hindiDistrict,
      },
    })
  }

  console.log('Migration completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
