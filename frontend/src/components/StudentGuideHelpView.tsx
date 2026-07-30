import React, { useState, useEffect } from 'react'
import { ArrowLeft, HelpCircle, UserPlus, LogIn, UserCheck, Clock, AlertTriangle, Award, BookOpen, Trash2, Info, Phone, Mail, MapPin, ExternalLink, ShieldCheck } from 'lucide-react'
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
      window.history.back()
    }
  }

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
              <span>{currentLang === 'hi' ? 'वापस' : 'Back'}</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-serif, Georgia, serif)', color: '#f5d782' }}>
                {currentLang === 'hi' ? 'भारत विकास परिषद' : 'Bharat Vikas Parishad'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                {currentLang === 'hi' ? 'ऑनलाइन परीक्षा प्रणाली एवं मोबाइल ऐप' : 'Online Exam System Portal & Mobile Application'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
              <HelpCircle size={22} style={{ color: '#f2bb50' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5d782' }}>
                {currentLang === 'hi' ? 'मार्गदर्शिका एवं सहायता' : 'Guide & Support'}
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
                STUDENT GUIDE & SUPPORT
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              Complete Instructions, FAQs, and Technical Support Contact Details
            </p>
          </div>

          {/* Guide Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.7 }}>
            
            {/* 1. Registration */}
            <section style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} style={{ color: '#c59f2d' }} />
                <span>Registration</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Students may register for the Online Exam System by providing the following information:
              </p>
              <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.5rem', color: '#334155', fontSize: '0.925rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.25rem' }}>
                <li>First Name</li>
                <li>Last Name</li>
                <li>Father's Name</li>
                <li>Mother's Name</li>
                <li>Mobile Number</li>
                <li>School Name</li>
              </ul>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.95rem' }}>
                The registered school may be selected by <strong>searching the school name</strong> or <strong>entering the school's UDISE Number</strong>. Once selected, the corresponding Tehsil and District will automatically be displayed.
              </p>
              <p style={{ margin: 0, color: '#0b2240', fontSize: '0.925rem', fontWeight: 600 }}>
                The registered mobile number shall be verified through a One-Time Password (OTP). Upon successful verification, student registration is completed and the student is automatically logged in.
              </p>
            </section>

            {/* 2. Login */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogIn size={20} style={{ color: '#c59f2d' }} />
                <span>Login</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                After registration, students are not required to register again. Students may log in simply by entering their registered mobile number and completing OTP verification (where applicable).
              </p>
              <p style={{ margin: 0, color: '#dc2626', fontWeight: 600, fontSize: '0.925rem' }}>
                Each mobile number is unique and may be used to register only one student account. Multiple registrations using the same mobile number are not permitted.
              </p>
            </section>

            {/* 3. Profile Management */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={20} style={{ color: '#c59f2d' }} />
                <span>Profile Management</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Students may update or edit their personal information at any time through the <strong>Edit Profile</strong> section. Editable information includes:
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem', color: '#334155', fontSize: '0.925rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.25rem' }}>
                <li>First Name</li>
                <li>Last Name</li>
                <li>Father's Name</li>
                <li>Mother's Name</li>
              </ul>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Certain examination-related information, such as the registered school or examination records, may not be editable after participation in an examination.
              </p>
            </section>

            {/* 4. Examination Progress */}
            <section style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: '#2563eb' }} />
                <span>Examination Progress & Resuming Exams</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.975rem' }}>
                The Platform is designed to automatically save examination progress at regular intervals.
              </p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.925rem' }}>
                If a student loses internet connectivity, accidentally closes the application, logs out during an exam, or experiences an interruption:
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.25rem', color: '#1e3a8a', fontSize: '0.925rem' }}>
                <li>The examination timer continues to run based on official examination duration.</li>
                <li>The student may log back in and resume the examination from the last saved progress before time expires.</li>
              </ul>
              <p style={{ margin: 0, color: '#9f1239', fontWeight: 600, fontSize: '0.9rem' }}>
                If the allotted time expires, the examination is automatically submitted and cannot be resumed.
              </p>
            </section>

            {/* 5. Automatic Submission */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} style={{ color: '#d97706' }} />
                <span>Automatic Submission</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                An examination will automatically be submitted if the examination duration expires, the student fails to resume before time ends, or the session concludes according to system rules.
              </p>
            </section>

            {/* 6. Certificates and Answer Sheet */}
            <section style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} style={{ color: '#16a34a' }} />
                <span>Certificates and Answer Sheet</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#14532d', fontSize: '0.975rem' }}>
                Upon successful completion of an examination (where enabled by Bharat Vikas Parishad), students may immediately access:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#14532d', fontSize: '0.925rem', fontWeight: 700 }}>
                <li>Download Certificate</li>
                <li>Download Answer Sheet</li>
              </ul>
            </section>

            {/* 7. Study Resources */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} style={{ color: '#c59f2d' }} />
                <span>Study Resources</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Students may access learning materials through the Resources section of the Platform. Resources include study material, reference documents, practice content, guidelines, and educational notifications published by Bharat Vikas Parishad.
              </p>
            </section>

            {/* 8. Account Deletion */}
            <section style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#9f1239', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={20} style={{ color: '#e11d48' }} />
                <span>Account Deletion & Recovery Policy</span>
              </h2>
              <p style={{ margin: '0 0 0.75rem 0', color: '#881337', fontSize: '0.975rem' }}>
                Students may request account deletion through either method:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #fda4af' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: '#9f1239', fontWeight: 700 }}>Option 1 – In-App Request</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
                    Navigate to: <strong>Settings → Delete Account</strong> directly from the mobile app or web portal.
                  </p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #fda4af' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: '#9f1239', fontWeight: 700 }}>Option 2 – Email Support</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
                    Email <a href="mailto:info@neopaceinfotech.com" style={{ color: '#2563eb' }}>info@neopaceinfotech.com</a> with your Name, Mobile Number, and School Name.
                  </p>
                </div>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', color: '#881337', fontSize: '0.925rem', fontWeight: 600 }}>
                Soft-Delete & 30-Day Recovery Period:
              </p>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
                Upon receiving a deletion request, the account is placed in a soft-deleted state for 30 calendar days. During this period, logging in or contacting support will restore the account. After 30 days, the account is permanently deleted or anonymized.
              </p>
            </section>

            {/* 9. Important Notes */}
            <section style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#854d0e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={20} style={{ color: '#ca8a04' }} />
                <span>Important Notes</span>
              </h2>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#713f12', fontSize: '0.925rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Each student may register only once using a unique mobile number.</li>
                <li>Registration is completed only after successful OTP verification.</li>
                <li>Examination progress is automatically saved.</li>
                <li>The examination timer continues even if the student logs out or loses internet connectivity.</li>
                <li>Students may resume the examination only within the remaining allotted examination time.</li>
                <li>Once the examination time expires, the examination is automatically submitted.</li>
                <li>Certificates and answer sheets are available only where enabled for the respective programme.</li>
                <li>Students are responsible for ensuring that registration information is accurate and complete.</li>
              </ul>
            </section>

            {/* 10. Contact Us & Addresses */}
            <section style={{
              marginTop: '1rem',
              paddingTop: '1.5rem',
              borderTop: '2px dashed #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0b2240', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={22} style={{ color: '#c59f2d' }} />
                <span>Contact & Support Information</span>
              </h2>

              {/* Direct Channels Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {/* Phone */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={24} style={{ color: '#16a34a' }} />
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Helpline / Support Phone</span>
                    <a href="tel:+917744065164" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0b2240', textDecoration: 'none' }}>+91 77440 65164</a>
                  </div>
                </div>

                {/* Email */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={24} style={{ color: '#2563eb' }} />
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Official Support Email</span>
                    <a href="mailto:info@neopaceinfotech.com" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>info@neopaceinfotech.com</a>
                  </div>
                </div>

                {/* Websites */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ExternalLink size={24} style={{ color: '#d97706' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Web Portals</span>
                    <a href="https://bvpindia.org" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>bvpindia.org</a>
                    <a href="https://neopaceinfotech.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>neopaceinfotech.com</a>
                  </div>
                </div>
              </div>

              {/* Office Addresses */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
                {/* Registered Address */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#0b2240' }}>
                    <MapPin size={20} style={{ color: '#c59f2d' }} />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Registered Office Address</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                    <strong>NeoPace Infotech LLP</strong><br />
                    9th Floor, Office No. 920, Gera's Imperium Rise Plaza,<br />
                    Hinjewadi Phase 2, Rajiv Gandhi Infotech Park,<br />
                    Hinjawadi, Pune, Maharashtra 411057
                  </p>
                </div>

                {/* Kothrud Branch Address */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#0b2240' }}>
                    <MapPin size={20} style={{ color: '#c59f2d' }} />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Kothrud Branch Address</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                    <strong>NeoPace Infotech LLP</strong><br />
                    Swapnali HCS, Office No. 403,<br />
                    Kothrud, Pune, Maharashtra 411038
                  </p>
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
        © {new Date().getFullYear()} Bharat Vikas Parishad. Powered by <strong>NeoPace Infotech LLP</strong>
      </footer>
    </div>
  )
}
