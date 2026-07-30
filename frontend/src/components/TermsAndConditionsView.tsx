import React, { useState, useEffect } from 'react'
import { ArrowLeft, ShieldCheck, FileText, Building2, ExternalLink } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { Language } from '../utils/localization'

interface TermsAndConditionsViewProps {
  onBack?: () => void
  lang?: Language
  onChangeLang?: (lang: Language) => void
}

export function TermsAndConditionsView({ onBack, lang = 'en', onChangeLang }: TermsAndConditionsViewProps) {
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
              <ShieldCheck size={22} style={{ color: '#f2bb50' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5d782' }}>
                {isHi ? 'नियम और शर्तें' : 'Terms & Conditions'}
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
              <FileText size={28} style={{ color: '#0b2240' }} />
              <h1 style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0b2240',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                letterSpacing: '-0.02em'
              }}>
                {isHi ? 'नियम एवं शर्तें' : 'TERMS AND CONDITIONS'}
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              {isHi ? 'ऑनलाइन परीक्षा प्रणाली पोर्टल एवं मोबाइल एप्लिकेशन के लिए' : 'For the Online Exam System Portal and Mobile Application'}
            </p>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.825rem',
              fontWeight: 700,
              marginTop: '1rem',
              border: '1px solid #bfdbfe'
            }}>
              {isHi ? 'प्रभावी तिथि: 30/07/2026' : 'Effective Date: 30/07/2026'}
            </div>
          </div>

          {/* Policy Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7 }}>
            
            {/* 1. Acceptance */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>1.</span> {isHi ? 'स्वीकृति (Acceptance)' : 'Acceptance'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'ऑनलाइन परीक्षा प्रणाली पोर्टल और मोबाइल ऐप तक पहुंच या उपयोग करके, आप इन नियमों और शर्तों का अनुपालन करने के लिए सहमत होते हैं। यदि आप सहमत नहीं हैं, तो आपको प्लेटफ़ॉर्म का उपयोग बंद कर देना चाहिए।' 
                  : 'By accessing or using the Online Exam System Portal and Mobile Application, you agree to comply with these Terms and Conditions. If you do not agree, you should discontinue use of the Platform.'}
              </p>
            </section>

            {/* 2. Purpose */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>2.</span> {isHi ? 'उद्देश्य (Purpose)' : 'Purpose'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi
                  ? 'यह प्लेटफ़ॉर्म विशेष रूप से भारत विकास परिषद द्वारा आयोजित ऑनलाइन परीक्षाओं, शैक्षणिक कार्यक्रमों, पंजीकरण, मूल्यांकन, प्रतियोगिताओं, प्रमाणपत्रों और अन्य पहलों के संचालन के लिए है।'
                  : 'The Platform is intended exclusively for conducting online examinations, educational programmes, registrations, assessments, competitions, certifications, and other initiatives organized by Bharat Vikas Parishad.'}
              </p>
            </section>

            {/* 3. User Registration */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>3.</span> {isHi ? 'उपयोगकर्ता पंजीकरण (User Registration)' : 'User Registration'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'उपयोगकर्ता सहमत होते हैं कि:' : 'Users agree that:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>{isHi ? 'प्रदान की गई जानकारी सत्य और सटीक है।' : 'Information provided is true and accurate.'}</li>
                <li>{isHi ? 'मोबाइल नंबर उपयोगकर्ता का है या उचित अनुमति के साथ प्रयोग किया गया है।' : 'Mobile numbers belong to the user or are used with proper authorization.'}</li>
                <li>{isHi ? 'दोहरे या फर्जी पंजीकरण रद्द किए जा सकते हैं।' : 'Duplicate registrations may be rejected.'}</li>
                <li>{isHi ? 'गलत जानकारी के कारण पंजीकरण रद्द किया जा सकता है।' : 'False information may result in cancellation.'}</li>
              </ul>
            </section>

            {/* 4. Examination Rules */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>4.</span> {isHi ? 'परीक्षा नियम एवं सत्यनिष्ठा' : 'Examination Rules'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'शिक्षार्थियों / प्रतिभागियों को:' : 'Participants shall:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>{isHi ? 'ईमानदारी से परीक्षा देनी चाहिए।' : 'Attempt examinations honestly.'}</li>
                <li>{isHi ? 'किसी भी अनुचित साधन का उपयोग नहीं करना चाहिए।' : 'Avoid any unfair practices.'}</li>
                <li>{isHi ? 'किसी अन्य प्रतिभागी का रूप धारण नहीं करना चाहिए।' : 'Not impersonate another participant.'}</li>
                <li>{isHi ? 'परीक्षा परिणामों में हेरफेर नहीं करना चाहिए।' : 'Not manipulate examination results.'}</li>
                <li>{isHi ? 'भारत विकास परिषद द्वारा जारी सभी निर्देशों का पालन करना चाहिए।' : 'Follow all instructions issued by Bharat Vikas Parishad.'}</li>
              </ul>
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontWeight: 600, fontSize: '0.925rem' }}>
                {isHi ? 'उल्लंघन करने पर अयोग्य घोषित किया जा सकता है।' : 'Violation may result in disqualification.'}
              </p>
            </section>

            {/* 5. Account Responsibility */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>5.</span> {isHi ? 'खाता एवं सुरक्षा जिम्मेदारी' : 'Account Responsibility'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'उपयोगकर्ता इसके लिए जिम्मेदार हैं:' : 'Users are responsible for:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>{isHi ? 'अपने पंजीकृत मोबाइल नंबर की सुरक्षा करना।' : 'Protecting their registered mobile number.'}</li>
                <li>{isHi ? 'ओटीपी कोड को गोपनीय रखना।' : 'Keeping OTP confidential.'}</li>
                <li>{isHi ? 'अनधिकृत पहुंच को रोकना।' : 'Preventing unauthorized access.'}</li>
                <li>{isHi ? 'किसी भी संदिग्ध दुरुपयोग की तुरंत रिपोर्ट करना।' : 'Immediately reporting any suspected misuse.'}</li>
              </ul>
            </section>

            {/* 6. Intellectual Property */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>6.</span> {isHi ? 'बौद्धिक संपदा अधिकार' : 'Intellectual Property'}
              </h2>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi
                  ? 'सभी कार्यक्रम नाम, परीक्षा सामग्री, लोगो, ट्रेडमार्क, शैक्षणिक सामग्री, प्रमाणपत्र, ब्रांडिंग और संबंधित बौद्धिक संपदा भारत विकास परिषद की संपदा हैं।'
                  : 'All programme names, examination content, logos, trademarks, educational material, certificates, branding, and related intellectual property belong to Bharat Vikas Parishad or their respective owners.'}
              </p>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi
                  ? 'नियोपेस इन्फोटेक एलएलपी द्वारा विकसित सॉफ्टवेयर एप्लिकेशन, सोर्स कोड, एपीआई, डेटाबेस आर्किटेक्चर, सर्वर अवसंरचना, यूआई/यूएक्स डिजाइन और तकनीक नियोपेस इन्फोटेक एलएलपी की बौद्धिक संपदा है।'
                  : 'The software application, source code, APIs, database architecture, server configuration, deployment infrastructure, technical framework, UI/UX design, and proprietary technology developed by NeoPace Infotech LLP remain the intellectual property of NeoPace Infotech LLP unless otherwise agreed in writing.'}
              </p>
            </section>

            {/* 7. Authorization */}
            <section style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>7.</span> {isHi ? 'तकनीकी विकास एवं संचालन प्राधिकरण' : 'Authorization'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'भारत विकास परिषद ने नियोपेस इन्फोटेक एलएलपी को इसके लिए अधिकृत किया है:' : 'Bharat Vikas Parishad has authorized NeoPace Infotech LLP to:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>{isHi ? 'प्लेटफ़ॉर्म विकसित करना।' : 'Develop the Platform.'}</li>
                <li>{isHi ? 'प्लेटफ़ॉर्म की मेजबानी एवं परिनियोजन (Hosting & Deployment)।' : 'Host and deploy the Platform.'}</li>
                <li>{isHi ? 'नियोपेस इन्फोटेक एलएलपी के आधिकारिक Google Play अकाउंट से एंड्रॉइड ऐप प्रकाशित करना।' : "Publish the Android Application through NeoPace Infotech LLP's official Google Play Developer Account."}</li>
                <li>{isHi ? 'तकनीकी सहायता, रखरखाव, सुरक्षा और प्लेटफ़ॉर्म प्रशासन प्रदान करना।' : 'Provide technical support, maintenance, software updates, hosting, security, and platform administration.'}</li>
              </ul>
            </section>

            {/* 8. Limitation of Liability */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>8.</span> {isHi ? 'दायित्व की सीमा' : 'Limitation of Liability'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'भारत विकास परिषद या नियोपेस इन्फोटेक एलएलपी इसके लिए उत्तरदायी नहीं होंगे:' : 'Neither Bharat Vikas Parishad nor NeoPace Infotech LLP shall be liable for:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>{isHi ? 'इंटरनेट विफलता या नेटवर्क व्यवधान।' : 'Internet failures.'}</li>
                <li>{isHi ? 'उपयोगकर्ता के उपकरण की असंगति।' : 'Device incompatibility.'}</li>
                <li>{isHi ? 'उपयोगकर्ताओं द्वारा दर्ज की गई गलत जानकारी।' : 'Incorrect information submitted by users.'}</li>
                <li>{isHi ? 'नियंत्रण से बाहर की तकनीकी रुकावटें।' : 'Technical interruptions beyond reasonable control.'}</li>
              </ul>
            </section>

            {/* 9. Governing Law */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>9.</span> {isHi ? 'शासी कानून एवं क्षेत्राधिकार' : 'Governing Law'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'ये नियम भारत के कानूनों द्वारा शासित होंगे। किसी भी विवाद का निपटारा पुणे, महाराष्ट्र स्थित न्यायालयों के क्षेत्राधिकार के अधीन होगा।'
                  : 'These Terms shall be governed by the laws of India. Any dispute shall be subject to the exclusive jurisdiction of the competent courts located at Pune, Maharashtra, unless otherwise required under applicable law.'}
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
                  <a href="https://bvpindia.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    https://bvpindia.com <ExternalLink size={12} />
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
                  {isHi ? 'अधिकृत तकनीकी विकास, होस्टिंग एवं रखरखाव पार्टनर' : 'Authorized Technical Development, Hosting, Deployment, Maintenance & Data Processing Partner'}
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
