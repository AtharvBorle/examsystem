import React, { useState, useEffect } from 'react'
import { ArrowLeft, ShieldCheck, FileText, Building2, ExternalLink } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { Language } from '../utils/localization'

interface PrivacyPolicyViewProps {
  onBack?: () => void
  lang?: Language
  onChangeLang?: (lang: Language) => void
}

export function PrivacyPolicyView({ onBack, lang = 'en', onChangeLang }: PrivacyPolicyViewProps) {
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
      <header className="info-page-header">
        <div className="info-page-header-container">
          <div className="info-page-header-left">
            <button
              onClick={handleBack}
              className="info-page-back-btn"
            >
              <ArrowLeft size={18} />
              <span>{isHi ? 'वापस' : 'Back'}</span>
            </button>

            <div className="info-page-org-title">
              <span className="info-page-org-name">
                {isHi ? 'भारत विकास परिषद' : 'Bharat Vikas Parishad'}
              </span>
              <span className="info-page-org-sub">
                {isHi ? 'ऑनलाइन परीक्षा प्रणाली एवं मोबाइल ऐप' : 'Online Exam System Portal & Mobile Application'}
              </span>
            </div>
          </div>

          <div className="info-page-header-right">
            <div className="info-page-badge">
              <ShieldCheck size={20} style={{ color: '#f2bb50' }} />
              <span className="info-page-badge-text">
                {isHi ? 'गोपनीयता नीति' : 'Privacy Policy'}
              </span>
            </div>
            <LanguageSelector lang={currentLang} onChangeLang={handleLangChange} isDark={true} />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="info-page-main">
        <div className="info-page-card">
          {/* Document Header */}
          <div className="info-page-doc-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <FileText size={26} style={{ color: '#0b2240', flexShrink: 0 }} />
              <h1 className="info-page-h1">
                {isHi ? 'गोपनीयता नीति' : 'PRIVACY POLICY'}
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              {isHi ? 'ऑनलाइन परीक्षा प्रणाली पोर्टल एवं मोबाइल एप्लिकेशन के लिए' : 'For the Online Exam System Portal and Mobile Application'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <div style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.825rem',
                fontWeight: 700,
                border: '1px solid #bfdbfe'
              }}>
                {isHi ? 'प्रभावी तिथि: 30/07/2026' : 'Effective Date: 30/07/2026'}
              </div>
              <div style={{
                backgroundColor: '#f0fdf4',
                color: '#166534',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.825rem',
                fontWeight: 700,
                border: '1px solid #bbf7d0'
              }}>
                {isHi ? 'DPDP अधिनियम अनुपालन ढांचा' : 'DPDP Act Compliant Framework'}
              </div>
            </div>
          </div>

          {/* Policy Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7 }}>
            
            {/* 1. Introduction */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>1.</span> {isHi ? 'परिचय (Introduction)' : 'Introduction'}
              </h2>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'ऑनलाइन परीक्षा प्रणाली पोर्टल और मोबाइल ऐप ("प्लेटफ़ॉर्म") में आपका स्वागत है, जिसका संचालन भारत विकास परिषद द्वारा किया जाता है तथा तकनीकी विकास, होस्टिंग एवं रखरखाव नियोपेस इन्फोटेक एलएलपी द्वारा किया जाता है।' 
                  : 'Welcome to the Online Exam System Portal and Mobile Application ("Platform"), operated by Bharat Vikas Parishad and developed, deployed, hosted, maintained, and technically managed by NeoPace Infotech LLP.'}
              </p>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi
                  ? 'यह गोपनीयता नीति बताती है कि जब आप आधिकारिक वेबसाइट https://bvpindia.org या एंड्रॉइड ऐप का उपयोग करते हैं तो हम आपकी व्यक्तिगत जानकारी कैसे एकत्र, उपयोग, संग्रहीत और सुरक्षित करते हैं।'
                  : 'This Privacy Policy explains how we collect, use, process, store, protect, and disclose your personal information when you use the Platform through the official website https://bvpindia.org or the official Android Mobile Application.'}
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>2.</span> {isHi ? 'हमारे द्वारा एकत्र की जाने वाली जानकारी' : 'Information We Collect'}
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                {/* Personal Info Card */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #0f3d7a' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0f3d7a', fontWeight: 700 }}>{isHi ? 'व्यक्तिगत जानकारी' : 'Personal Information'}</h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    <li>{isHi ? 'पूरा नाम एवं माता-पिता का नाम' : 'Full Name'}</li>
                    <li>{isHi ? 'मोबाइल नंबर' : 'Mobile Number'}</li>
                    <li>{isHi ? 'स्कूल का नाम एवं UDISE कोड' : 'School Name & UDISE Number'}</li>
                    <li>{isHi ? 'कक्षा, तालुका, जिला' : 'Class, Tehsil, District'}</li>
                    <li>{isHi ? 'भाषा प्राथमिकता' : 'Language Preference'}</li>
                  </ul>
                </div>

                {/* Technical Info Card */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#166534', fontWeight: 700 }}>{isHi ? 'तकनीकी जानकारी' : 'Technical Information'}</h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    <li>{isHi ? 'डिवाइस मॉडल एवं आईडी' : 'Device Model & Identifier'}</li>
                    <li>{isHi ? 'ऑपरेटिंग सिस्टम एवं ऐप संस्करण' : 'Operating System & App Version'}</li>
                    <li>{isHi ? 'ब्राउज़र, आईपी पता, दिनांक/समय' : 'Browser, IP Address, Date/Time'}</li>
                    <li>{isHi ? 'नेटवर्क स्थिति एवं क्रैश रिपोर्ट' : 'Network Info & Crash Reports'}</li>
                  </ul>
                </div>

                {/* Examination Info Card */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #d97706' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#92400e', fontWeight: 700 }}>{isHi ? 'परीक्षा संबंधी जानकारी' : 'Examination Information'}</h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    <li>{isHi ? 'परीक्षा पंजीकरण विवरण' : 'Exam Registration Details'}</li>
                    <li>{isHi ? 'उत्तर एवं प्राप्तांक' : 'Submitted Responses & Scores'}</li>
                    <li>{isHi ? 'रैंकिंग एवं प्रमाणपत्र' : 'Rankings & Certificates'}</li>
                    <li>{isHi ? 'परीक्षा पूर्णता रिकॉर्ड' : 'Completion Status & Records'}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. Purpose of Data Collection */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>3.</span> {isHi ? 'डेटा उपयोग एवं उद्देश्य' : 'Purpose of Data Collection'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'हम शैक्षणिक एवं प्रशासनिक उद्देश्यों के लिए डेटा एकत्र करते हैं:' : 'We collect information for legitimate educational and administrative purposes, including:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.25rem 1rem' }}>
                <li>{isHi ? 'छात्र पंजीकरण' : 'Student Registration'}</li>
                <li>{isHi ? 'ओटीपी सत्यापन' : 'User Authentication'}</li>
                <li>{isHi ? 'ऑनलाइन परीक्षा संचालन' : 'Conducting Online Examinations'}</li>
                <li>{isHi ? 'परिणाम एवं मेरिट लिस्ट' : 'Generating Results'}</li>
                <li>{isHi ? 'प्रमाणपत्र जनरेशन' : 'Certificate Generation'}</li>
                <li>{isHi ? 'फर्जी पंजीकरण रोकना' : 'Preventing Duplicate Registrations'}</li>
                <li>{isHi ? 'तकनीकी सहायता एवं रखरखाव' : 'Technical Support'}</li>
              </ul>
            </section>

            {/* 4. Data Security */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>4.</span> {isHi ? 'डेटा सुरक्षा एवं गोपनीयता' : 'Data Security'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'हम डेटा सुरक्षा के लिए मजबूत तकनीकी उपाय लागू करते हैं जैसे HTTPS एन्क्रिप्शन, सुरक्षित क्लाउड इंफ्रास्ट्रक्चर और नियमित सुरक्षा ऑडिट।' 
                  : 'Reasonable technical and organizational safeguards are implemented, including Secure Cloud Infrastructure and HTTPS Encryption.'}
              </p>
            </section>

            {/* Contact Section */}
            <section style={{
              marginTop: '1rem',
              paddingTop: '1.5rem',
              borderTop: '2px dashed #e2e8f0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Bharat Vikas Parishad Contact */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Building2 size={20} style={{ color: '#0b2240' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0b2240' }}>
                    {isHi ? 'भारत विकास परिषद' : 'Bharat Vikas Parishad'}
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  {isHi ? 'कार्यक्रम स्वामी एवं संगठन' : 'Programme Owner & Data Controller'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
                  <span>{isHi ? 'वेबसाइट:' : 'Website:'}</span>
                  <a href="https://bvpindia.org" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    https://bvpindia.org <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* NeoPace Infotech LLP Contact */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Building2 size={20} style={{ color: '#0b2240' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0b2240' }}>
                    NeoPace Infotech LLP
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  {isHi ? 'अधिकृत तकनीकी विकास एवं रखरखाव पार्टनर' : 'Authorized Technical Development, Hosting & Maintenance Partner'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
                  <span>Email: <a href="mailto:info@neopaceinfotech.com" style={{ color: '#2563eb', textDecoration: 'none' }}>info@neopaceinfotech.com</a></span>
                  <span>{isHi ? 'वेबसाइट:' : 'Website:'}</span>
                  <a href="https://neopaceinfotech.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    https://neopaceinfotech.com <ExternalLink size={12} />
                  </a>
                </div>
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
