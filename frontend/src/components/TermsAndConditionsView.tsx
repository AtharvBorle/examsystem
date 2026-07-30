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
              <ShieldCheck size={22} style={{ color: '#f2bb50' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5d782' }}>
                {currentLang === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions'}
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
                TERMS AND CONDITIONS
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              For the Online Exam System Portal and Mobile Application
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
              Effective Date: 30/07/2026
            </div>
          </div>

          {/* Policy Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7 }}>
            
            {/* 1. Acceptance */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>1.</span> Acceptance
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                By accessing or using the Online Exam System Portal and Mobile Application, you agree to comply with these Terms and Conditions. If you do not agree, you should discontinue use of the Platform.
              </p>
            </section>

            {/* 2. Purpose */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>2.</span> Purpose
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                The Platform is intended exclusively for conducting online examinations, educational programmes, registrations, assessments, competitions, certifications, and other initiatives organized by Bharat Vikas Parishad.
              </p>
            </section>

            {/* 3. User Registration */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>3.</span> User Registration
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Users agree that:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Information provided is true and accurate.</li>
                <li>Mobile numbers belong to the user or are used with proper authorization.</li>
                <li>Duplicate registrations may be rejected.</li>
                <li>False information may result in cancellation.</li>
              </ul>
            </section>

            {/* 4. Examination Rules */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>4.</span> Examination Rules
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Participants shall:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Attempt examinations honestly.</li>
                <li>Avoid any unfair practices.</li>
                <li>Not impersonate another participant.</li>
                <li>Not manipulate examination results.</li>
                <li>Follow all instructions issued by Bharat Vikas Parishad.</li>
              </ul>
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontWeight: 600, fontSize: '0.925rem' }}>
                Violation may result in disqualification.
              </p>
            </section>

            {/* 5. Account Responsibility */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>5.</span> Account Responsibility
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Users are responsible for:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Protecting their registered mobile number.</li>
                <li>Keeping OTP confidential.</li>
                <li>Preventing unauthorized access.</li>
                <li>Immediately reporting any suspected misuse.</li>
              </ul>
            </section>

            {/* 6. Intellectual Property */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>6.</span> Intellectual Property
              </h2>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                All programme names, examination content, logos, trademarks, educational material, certificates, branding, and related intellectual property belong to Bharat Vikas Parishad or their respective owners.
              </p>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                The software application, source code, APIs, database architecture, server configuration, deployment infrastructure, technical framework, UI/UX design, and proprietary technology developed by NeoPace Infotech LLP remain the intellectual property of NeoPace Infotech LLP unless otherwise agreed in writing.
              </p>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem', fontWeight: 600 }}>
                Nothing contained in these Terms transfers ownership of either party's intellectual property.
              </p>
            </section>

            {/* 7. Authorization */}
            <section style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>7.</span> Authorization
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Bharat Vikas Parishad has authorized NeoPace Infotech LLP to:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Develop the Platform.</li>
                <li>Host and deploy the Platform.</li>
                <li>Publish the Android Application through NeoPace Infotech LLP's official Google Play Developer Account.</li>
                <li>Use NeoPace Infotech LLP's D-U-N-S registration for application publishing.</li>
                <li>Use Bharat Vikas Parishad's name and logo solely for authorized purposes.</li>
                <li>Maintain and technically operate the Platform.</li>
                <li>Process personal information solely on behalf of Bharat Vikas Parishad.</li>
                <li>Provide technical support, maintenance, software updates, hosting, security, and platform administration.</li>
                <li>Promote and market the official Platform as authorized.</li>
              </ul>
              <p style={{ margin: '0.75rem 0 0 0', color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                This authorization does not transfer ownership of Bharat Vikas Parishad's trademarks, educational content, programmes, or intellectual property.
              </p>
            </section>

            {/* 8. Data Processing */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>8.</span> Data Processing
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                NeoPace Infotech LLP acts solely as the Authorized Technical Development, Hosting, Deployment, Maintenance and Data Processing Partner, processing personal information only under the instructions of Bharat Vikas Parishad and only for operating, maintaining, securing, improving, and administering the Platform.
              </p>
            </section>

            {/* 9. Limitation of Liability */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>9.</span> Limitation of Liability
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Neither Bharat Vikas Parishad nor NeoPace Infotech LLP shall be liable for:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Internet failures.</li>
                <li>Device incompatibility.</li>
                <li>User mistakes.</li>
                <li>Incorrect information submitted by users.</li>
                <li>Force majeure events.</li>
                <li>Temporary maintenance.</li>
                <li>Technical interruptions beyond reasonable control.</li>
              </ul>
            </section>

            {/* 10. Suspension and Termination */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>10.</span> Suspension and Termination
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Accounts may be suspended or removed if users:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Provide false information.</li>
                <li>Misuse the Platform.</li>
                <li>Violate applicable laws.</li>
                <li>Breach these Terms and Conditions.</li>
              </ul>
            </section>

            {/* 11. Modifications */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>11.</span> Modifications
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                Bharat Vikas Parishad and NeoPace Infotech LLP reserve the right to update these Terms and Conditions whenever necessary. Continued use of the Platform after modifications constitutes acceptance of the revised Terms.
              </p>
            </section>

            {/* 12. Governing Law */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>12.</span> Governing Law
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                These Terms shall be governed by the laws of India. Any dispute shall be subject to the exclusive jurisdiction of the competent courts located at Pune, Maharashtra, unless otherwise required under applicable law.
              </p>
            </section>

            {/* 13. Contact */}
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
                    Bharat Vikas Parishad
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  Programme Owner & Data Controller
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
                  <span>Website:</span>
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
                  Authorized Technical Development, Hosting, Deployment, Maintenance & Data Processing Partner
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
                  <span>Email: <a href="mailto:info@neopaceinfotech.com" style={{ color: '#2563eb', textDecoration: 'none' }}>info@neopaceinfotech.com</a></span>
                  <span>Website:</span>
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
        © {new Date().getFullYear()} Bharat Vikas Parishad. Powered by <strong>NeoPace Infotech LLP</strong>
      </footer>
    </div>
  )
}
