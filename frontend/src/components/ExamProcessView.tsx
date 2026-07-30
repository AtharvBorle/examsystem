import React, { useState, useEffect } from 'react'
import { ArrowLeft, BookOpen, Clock, HelpCircle, Navigation, CheckCircle2, AlertCircle, Save, Award, ExternalLink, Building2 } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { Language } from '../utils/localization'

interface ExamProcessViewProps {
  onBack?: () => void
  lang?: Language
  onChangeLang?: (lang: Language) => void
}

export function ExamProcessView({ onBack, lang = 'en', onChangeLang }: ExamProcessViewProps) {
  const [localLang, setLocalLang] = useState<Language>(lang)

  useEffect(() => {
    setLocalLang(lang)
  }, [lang])

  const currentLang = localLang
  const handleLangChange = (newLang: Language) => {
    setLocalLang(newLang)
    if (onChangeLang) onChangeLang(newLang)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      window.history.pushState({}, '', '/oes/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  const isHi = currentLang === 'hi'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Bar */}
      <header style={{
        backgroundColor: '#0b2240',
        color: '#ffffff',
        padding: '1.25rem 2rem',
        boxShadow: '0 4px 12px rgba(11, 34, 64, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleBack}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
            >
              <ArrowLeft size={18} />
              <span>{isHi ? 'वापस' : 'Back'}</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-serif, Georgia, serif)', color: '#f5d782' }}>
                {isHi ? 'भारत विकास परिषद' : 'Bharat Vikas Parishad'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                {isHi ? 'ऑनलाइन परीक्षा प्रणाली एवं मोबाइल ऐप' : 'Online Exam System Portal & Mobile Application'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
              <BookOpen size={22} style={{ color: '#f2bb50' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5d782' }}>
                {isHi ? 'परीक्षा प्रक्रिया' : 'Examination Process'}
              </span>
            </div>
            <LanguageSelector lang={currentLang} onChangeLang={handleLangChange} isDark={true} />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{
        flex: 1,
        maxWidth: '1000px',
        width: '100%',
        margin: '2rem auto',
        padding: '0 1.5rem',
        boxSizing: 'border-box'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
          padding: '2.5rem 3rem',
          boxSizing: 'border-box'
        }}>
          {/* Document Header */}
          <div style={{
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <BookOpen size={28} style={{ color: '#0b2240' }} />
              <h1 style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0b2240',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                letterSpacing: '-0.02em'
              }}>
                {isHi ? 'परीक्षा प्रक्रिया मार्गदर्शन' : 'EXAMINATION PROCESS GUIDE'}
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              {isHi ? 'भारत विकास परिषद ऑनलाइन परीक्षा प्रणाली के लिए चरण-दर-चरण निर्देश' : 'Step-by-step instructions for attempting online examinations'}
            </p>
          </div>

          {/* Process Steps List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: '#0b2240', color: '#f5d782', fontWeight: 800, fontSize: '1.2rem', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                1
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#0b2240' }}>
                  {isHi ? 'छात्र पंजीकरण एवं ओटीपी सत्यापन' : 'Student Registration & OTP Verification'}
                </h3>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {isHi 
                    ? 'छात्र अपना पूरा नाम, माता-पिता का नाम, स्कूल का नाम, कक्षा और मोबाइल नंबर दर्ज करके पंजीकरण करते हैं। मोबाइल नंबर पर प्राप्त 6-अंकों के ओटीपी कोड से सत्यापन पूरा किया जाता है।' 
                    : 'Students register by entering their full name, parents\' names, school name, classroom, and mobile number. Verification is completed using a 6-digit OTP sent to their mobile number.'}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: '#0b2240', color: '#f5d782', fontWeight: 800, fontSize: '1.2rem', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#0b2240' }}>
                  {isHi ? 'लॉगिन एवं परीक्षा का चयन' : 'Login & Select Assigned Examination'}
                </h3>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {isHi 
                    ? 'पंजीकृत मोबाइल नंबर से लॉगिन करने के पश्चात छात्र डैशबोर्ड पर उपलब्ध अपनी आवंटित परीक्षा (जैसे "भारत को जानो") का चयन करके "Start Exam" पर क्लिक करते हैं।' 
                    : 'After logging in with their registered mobile number, students view their assigned examinations (such as "Bharat Ko Jano") on the dashboard and click "Start Exam".'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: '#0b2240', color: '#f5d782', fontWeight: 800, fontSize: '1.2rem', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                3
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#0b2240' }}>
                  {isHi ? 'प्रश्नों के उत्तर देना एवं समय प्रबंधन' : 'Answering Questions & Managing Time'}
                </h3>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {isHi 
                    ? 'परीक्षा में बहुविकल्पीय प्रश्न (MCQs) होते हैं। छात्र प्रत्येक प्रश्न के चार विकल्पों में से सही विकल्प चुनते हैं। ऊपर चलता हुआ टाइमर शेष समय प्रदर्शित करता है।' 
                    : 'The exam consists of Multiple Choice Questions (MCQs). Select the correct option among the four choices. The countdown timer at the top displays remaining time.'}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: '#0b2240', color: '#f5d782', fontWeight: 800, fontSize: '1.2rem', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                4
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#0b2240' }}>
                  {isHi ? 'अंतिम सबमिशन एवं त्वरित परिणाम' : 'Final Submission & Instant Results'}
                </h3>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {isHi 
                    ? 'सभी प्रश्नों के उत्तर देने के बाद अंतिम प्रश्न पर "Submit" बटन दबाएं। परीक्षा समाप्त होते ही छात्र का प्राप्तांक, प्रतिशत तथा विस्तृत उत्तर पुस्तिका स्क्रीन पर तुरंत प्रदर्शित हो जाती है।' 
                    : 'After answering all questions, click "Submit" on the final question. Upon submission, the student\'s score, percentage, and detailed answer sheet appear instantly.'}
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: '#0b2240', color: '#f5d782', fontWeight: 800, fontSize: '1.2rem', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                5
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#0b2240' }}>
                  {isHi ? 'प्रमाणपत्र एवं उत्तर पुस्तिका डाउनलोड' : 'Certificate & Answersheet Download'}
                </h3>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {isHi 
                    ? 'सफलतापूर्वक परीक्षा पूर्ण करने वाले छात्र अपना आधिकारिक सहभागिता प्रमाणपत्र (Participation Certificate) तथा विस्तृत उत्तर पुस्तिका (Answersheet) PDF प्रारूप में सीधे डाउनलोड कर सकते हैं।' 
                    : 'Students who complete their examination can download their official Participation Certificate and detailed Answersheet in PDF format directly to their device.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        fontSize: '0.85rem',
        color: '#64748b',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#ffffff'
      }}>
        © {new Date().getFullYear()} {isHi ? 'भारत विकास परिषद। द्वारा संचालित' : 'Bharat Vikas Parishad. Powered by'} <strong>NeoPace Infotech LLP</strong>
      </footer>
    </div>
  )
}
