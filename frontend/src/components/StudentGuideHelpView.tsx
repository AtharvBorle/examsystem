import React, { useState, useEffect } from 'react'
import { ArrowLeft, HelpCircle, UserPlus, LogIn, UserCheck, Clock, AlertTriangle, Award, BookOpen, Trash2, Info, Phone, Mail, MapPin, ExternalLink, ShieldCheck, Building2 } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { Language } from '../utils/localization'

interface StudentGuideHelpViewProps {
  onBack?: () => void
  lang?: Language
  onChangeLang?: (lang: Language) => void
}

export function StudentGuideHelpView({ onBack, lang = 'en', onChangeLang }: StudentGuideHelpViewProps) {
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
              <HelpCircle size={22} style={{ color: '#f2bb50' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5d782' }}>
                {isHi ? 'मार्गदर्शिका एवं सहायता' : 'Guide & Support'}
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
              <HelpCircle size={28} style={{ color: '#0b2240' }} />
              <h1 style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0b2240',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                letterSpacing: '-0.02em'
              }}>
                {isHi ? 'छात्र मार्गदर्शिका एवं सहायता केंद्र' : 'STUDENT GUIDE & HELP CENTER'}
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              {isHi ? 'भारत विकास परिषद परीक्षा प्रणाली का उपयोग करने के लिए पूर्ण सहायता गाइड' : 'Complete assistance guide for students using the Online Exam System'}
            </p>
          </div>

          {/* Guide Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Section 1: Registration Guide */}
            <section style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} style={{ color: '#c59f2d' }} />
                {isHi ? '1. नया पंजीकरण कैसे करें' : '1. How to Register as a Student'}
              </h2>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', lineHeight: 1.6 }}>
                <li>{isHi ? 'मुख्य पृष्ठ पर "नया पंजीकरण" विकल्प चुनें।' : 'Select "New Student Registration" on the portal home page.'}</li>
                <li>{isHi ? 'अपना नाम, माता-पिता का नाम, कक्षा और स्कूल का नाम दर्ज करें।' : 'Fill in your Name, Parents\' Names, Classroom, and School.'}</li>
                <li>{isHi ? 'अपने स्कूल का नाम या UDISE कोड खोजकर सही स्कूल चुनें।' : 'Search for your school by Name or UDISE Code.'}</li>
                <li>{isHi ? 'अपना 10-अंकों का मोबाइल नंबर दर्ज करें तथा OTP सत्यापित करें।' : 'Enter your 10-digit mobile number and verify via OTP.'}</li>
              </ul>
            </section>

            {/* Section 2: Login */}
            <section style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogIn size={20} style={{ color: '#c59f2d' }} />
                {isHi ? '2. दोबारा लॉगिन कैसे करें' : '2. How to Log In Again'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {isHi 
                  ? 'यदि आप पहले से पंजीकृत हैं, तो दोबारा फॉर्म भरने की आवश्यकता नहीं है। बस अपना पंजीकृत मोबाइल नंबर दर्ज करें और आप तुरंत अपने डैशबोर्ड पर पहुंच जाएंगे।' 
                  : 'If you are already registered, you do not need to fill the registration form again. Simply enter your registered mobile number on the login screen to access your dashboard.'}
              </p>
            </section>

            {/* Section 3: Technical Support */}
            <section style={{ backgroundColor: '#eff6ff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={20} style={{ color: '#2563eb' }} />
                {isHi ? '3. तकनीकी सहायता एवं संपर्क' : '3. Technical Support & Contact'}
              </h2>
              <p style={{ margin: '0 0 0.75rem 0', color: '#1e3a8a', fontSize: '0.95rem' }}>
                {isHi 
                  ? 'यदि आपको परीक्षा या ऐप के उपयोग में किसी भी प्रकार की तकनीकी समस्या आती है, तो नियोपेस इन्फोटेक एलएलपी की सहायता टीम से संपर्क करें:' 
                  : 'If you face any technical difficulties while taking an exam or using the app, please contact the NeoPace Infotech LLP support team:'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#1e40af' }}>
                <span>Email: <a href="mailto:info@neopaceinfotech.com" style={{ color: '#2563eb', textDecoration: 'none' }}>info@neopaceinfotech.com</a></span>
                <span>Website: <a href="https://neopaceinfotech.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>https://neopaceinfotech.com</a></span>
              </div>
            </section>

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
