import fs from 'fs'
import path from 'path'

const TRANSLATIONS_FILE = path.join(process.cwd(), 'src/lib/category-translations.json')

// Predefined Dictionary of Common School Subject Categories and Subcategories
const CATEGORY_MAP: { [key: string]: string } = {
  'general knowledge': 'सामान्य ज्ञान',
  'gk': 'सामान्य ज्ञान',
  'mathematics': 'गणित',
  'maths': 'गणित',
  'math': 'गणित',
  'science': 'विज्ञान',
  'english': 'अंग्रेजी',
  'social science': 'सामाजिक विज्ञान',
  'social studies': 'सामाजिक अध्ययन',
  'history': 'इतिहास',
  'geography': 'भूगोल',
  'civics': 'नागरिक शास्त्र',
  'physics': 'भौतिकी',
  'chemistry': 'रसायन विज्ञान',
  'biology': 'जीव विज्ञान',
  'environmental studies': 'पर्यावरण अध्ययन',
  'evs': 'पर्यावरण अध्ययन',
  'hindi': 'हिंदी',
  'sanskrit': 'संस्कृत',
  'computer': 'कंप्यूटर',
  'computer science': 'कंप्यूटर विज्ञान',
  'mental ability': 'मानसिक योग्यता',
  'reasoning': 'तर्कशक्ति',
  'current affairs': 'सामयिकी',
  'general science': 'सामान्य विज्ञान',
  'logical reasoning': 'तार्किक विचार',
  'aptitude': 'अभियोग्यता',
  'drawing': 'चित्रकला',
}

// Load translations from file
function loadTranslations(): { [key: string]: string } {
  try {
    if (fs.existsSync(TRANSLATIONS_FILE)) {
      const content = fs.readFileSync(TRANSLATIONS_FILE, 'utf8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error('Failed to load category-translations.json:', error)
  }
  return {}
}

// Save translations to file
function saveTranslations(translations: { [key: string]: string }) {
  try {
    const dir = path.dirname(TRANSLATIONS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(translations, null, 2), 'utf8')
  } catch (error) {
    console.error('Failed to save category-translations.json:', error)
  }
}

// Translate category or subcategory name to Hindi
export function translateCategoryName(englishName: string, lang: string): string {
  if (lang !== 'hi' || !englishName) return englishName

  const cleaned = englishName.trim()
  const translations = loadTranslations()

  // If already in file cache, return it
  if (translations[cleaned]) {
    return translations[cleaned]
  }

  const lower = cleaned.toLowerCase()
  let hindiName = cleaned

  // Check if we have a matching keyword in our dictionary
  let found = false
  for (const [engWord, hiWord] of Object.entries(CATEGORY_MAP)) {
    // Match exact word boundaries or direct substrings
    if (lower === engWord || lower.startsWith(engWord + ' ') || lower.endsWith(' ' + engWord)) {
      hindiName = hiWord
      found = true
      break
    }
  }

  // Fallback: If not found, look for simple inclusion
  if (!found) {
    for (const [engWord, hiWord] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(engWord)) {
        hindiName = hiWord
        found = true
        break
      }
    }
  }

  // Save the result to the translations file
  translations[cleaned] = hindiName
  saveTranslations(translations)

  return hindiName
}
