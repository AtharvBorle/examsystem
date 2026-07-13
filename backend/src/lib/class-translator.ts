import fs from 'fs'
import path from 'path'

const TRANSLATIONS_FILE = path.join(process.cwd(), 'src/lib/class-translations.json')

// Hindi Ordinal Mapping (matching target standard formatting: Ordinal + Name (Num + Class))
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
}

// Load translations from file
function loadTranslations(): { [key: string]: string } {
  try {
    if (fs.existsSync(TRANSLATIONS_FILE)) {
      const content = fs.readFileSync(TRANSLATIONS_FILE, 'utf8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error('Failed to load class-translations.json:', error)
  }
  return {}
}

// Save translations to file
function saveTranslations(translations: { [key: string]: string }) {
  try {
    // Ensure parent dir exists
    const dir = path.dirname(TRANSLATIONS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(translations, null, 2), 'utf8')
  } catch (error) {
    console.error('Failed to save class-translations.json:', error)
  }
}

// Translate classroom name to Hindi
export function translateClassroomName(englishName: string, lang: string): string {
  if (lang !== 'hi') return englishName

  const cleaned = englishName.trim()
  const translations = loadTranslations()

  // If already in file, return it
  if (translations[cleaned]) {
    return translations[cleaned]
  }

  // Generate translation on the basis of number
  let hindiName = cleaned

  // Try to find a number in the class name (1 to 12)
  const numMatch = cleaned.match(/(12|11|10|[1-9])/)
  const romanMatch = cleaned.match(/\b(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/i)

  let num: number | null = null
  if (numMatch) {
    num = parseInt(numMatch[1])
  } else if (romanMatch) {
    num = ROMAN_MAP[romanMatch[1].toLowerCase()]
  }

  if (num && HINDI_ORDINALS[num]) {
    hindiName = HINDI_ORDINALS[num]

    // If there is any section (like A, B, C, D, Div A) in the original name
    // e.g. "Class 5 A" or "5th - B"
    const sectionMatch = cleaned.match(/\b([A-D])\b/i)
    if (sectionMatch) {
      const section = sectionMatch[1].toUpperCase()
      const hindiSection = section === 'A' ? 'ए' : section === 'B' ? 'बी' : section === 'C' ? 'सी' : 'डी'
      hindiName += ` - ${hindiSection}`
    }
  } else {
    // Try to match fallback words
    const lower = cleaned.toLowerCase()
    let matchedFallback = false
    for (const [engWord, hiWord] of Object.entries(FALLBACK_WORDS)) {
      if (lower.includes(engWord)) {
        hindiName = hiWord
        matchedFallback = true
        break
      }
    }
    if (!matchedFallback) {
      // General translation if no numbers/keywords found
      hindiName = cleaned
    }
  }

  // Store in file
  translations[cleaned] = hindiName
  saveTranslations(translations)

  return hindiName
}
