import React from 'react'
import { ArrowLeft, ShieldCheck, FileText, Building2, ExternalLink } from 'lucide-react'

interface PrivacyPolicyViewProps {
  onBack?: () => void
}

export function PrivacyPolicyView({ onBack }: PrivacyPolicyViewProps) {
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
              <span>Back</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-serif, Georgia, serif)', color: '#f5d782' }}>
                Bharat Vikas Parishad
              </span>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                Online Exam System Portal & Mobile Application
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
            <ShieldCheck size={22} style={{ color: '#f2bb50' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5d782' }}>Official Privacy Policy</span>
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
                PRIVACY POLICY
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              For the Online Exam System Portal and Mobile Application
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
                Effective Date: 30/07/2026
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
                DPDP Act Compliant Framework
              </div>
            </div>
          </div>

          {/* Policy Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7 }}>
            
            {/* 1. Introduction */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>1.</span> Introduction
              </h2>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Welcome to the Online Exam System Portal and Mobile Application ("Platform"), operated by Bharat Vikas Parishad and developed, deployed, hosted, maintained, and technically managed by NeoPace Infotech LLP.
              </p>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                This Privacy Policy explains how we collect, use, process, store, protect, and disclose your personal information when you use the Platform through the official website <a href="https://bvpindia.org" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>https://bvpindia.org</a> or the official Android Mobile Application.
              </p>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                The Platform is designed to conduct online examinations, educational programmes, competitions, assessments, registrations, certifications, and other initiatives organized by Bharat Vikas Parishad, including but not limited to Bharat Ko Jano and other future programmes.
              </p>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem', fontWeight: 600 }}>
                By accessing or using the Platform, you agree to this Privacy Policy.
              </p>
            </section>

            {/* 2. About the Platform */}
            <section style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>2.</span> About the Platform
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                The Online Exam System Portal and Mobile Application has been developed under the authorization of Bharat Vikas Parishad.
              </p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                NeoPace Infotech LLP has been authorized by Bharat Vikas Parishad to:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Design, develop, and maintain the Platform.</li>
                <li>Host, deploy, and technically operate the Platform.</li>
                <li>Publish the official Android application through NeoPace Infotech LLP's Google Play Developer Account and D-U-N-S registration.</li>
                <li>Use Bharat Vikas Parishad's name and logo solely for authorized purposes.</li>
                <li>Manage technical infrastructure, cloud hosting, application deployment, software updates, maintenance, and security.</li>
                <li>Process personal information strictly on behalf of Bharat Vikas Parishad.</li>
                <li>Provide technical support and platform administration.</li>
                <li>Promote and market the official Online Exam System Platform as authorized.</li>
              </ul>
              <p style={{ margin: '0.75rem 0 0 0', color: '#0b2240', fontSize: '0.925rem', fontWeight: 600 }}>
                Bharat Vikas Parishad remains the sole owner of all programmes, examination content, branding, trademarks, logos, certificates, educational materials, and associated intellectual property.
              </p>
            </section>

            {/* 3. Information We Collect */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>3.</span> Information We Collect
              </h2>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Depending upon your use of the Platform, we may collect the following information:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                {/* Personal Info Card */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #0f3d7a' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0f3d7a', fontWeight: 700 }}>Personal Information</h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    <li>Full Name</li>
                    <li>Mobile Number</li>
                    <li>School Name & UDISE Number</li>
                    <li>Class, Tehsil, District</li>
                    <li>Language Preference</li>
                  </ul>
                </div>

                {/* Technical Info Card */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#166534', fontWeight: 700 }}>Technical Information</h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    <li>Device Model & Identifier</li>
                    <li>Operating System & App Version</li>
                    <li>Browser, IP Address, Date/Time</li>
                    <li>Network Info & Crash Reports</li>
                  </ul>
                </div>

                {/* Examination Info Card */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #d97706' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#92400e', fontWeight: 700 }}>Examination Information</h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    <li>Exam Registration Details</li>
                    <li>Submitted Responses & Scores</li>
                    <li>Rankings & Certificates</li>
                    <li>Completion Status & Records</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. Purpose of Data Collection */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>4.</span> Purpose of Data Collection
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                We collect information for legitimate educational and administrative purposes, including:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.25rem 1rem' }}>
                <li>Student Registration</li>
                <li>User Authentication</li>
                <li>Identity Verification</li>
                <li>Conducting Online Examinations</li>
                <li>Generating Results</li>
                <li>Certificate Generation</li>
                <li>Performance Analytics</li>
                <li>Preventing Duplicate Registrations</li>
                <li>Fraud Prevention</li>
                <li>Security Monitoring</li>
                <li>Technical Support</li>
                <li>Platform Maintenance</li>
                <li>Statistical Analysis</li>
                <li>Programme Administration</li>
                <li>Compliance with Legal Obligations</li>
              </ul>
            </section>

            {/* 5. Legal Basis for Processing */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>5.</span> Legal Basis for Processing
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Personal information is processed for:
              </p>
              <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li>Administration of Bharat Vikas Parishad educational programmes.</li>
                <li>Performance of services requested by users.</li>
                <li>Compliance with applicable laws.</li>
                <li>Legitimate interests relating to platform security and administration.</li>
                <li>Consent where required.</li>
              </ul>
              <p style={{ margin: 0, color: '#0b2240', fontSize: '0.95rem', fontWeight: 600 }}>
                Processing shall be carried out in accordance with applicable Indian laws, including the Digital Personal Data Protection Act, 2023 (DPDP Act) wherever applicable.
              </p>
            </section>

            {/* 6. Data Sharing */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>6.</span> Data Sharing
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#dc2626', fontWeight: 700, fontSize: '0.975rem' }}>
                We do not sell personal information.
              </p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Information may be shared only with:
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.25rem 1rem' }}>
                <li>Bharat Vikas Parishad</li>
                <li>Authorized Programme Administrators</li>
                <li>Participating Schools</li>
                <li>Examination Coordinators</li>
                <li>Cloud Hosting Providers</li>
                <li>SMS Service Providers</li>
                <li>Database Services</li>
                <li>Analytics Providers</li>
                <li>Technical Vendors engaged by NeoPace Infotech LLP</li>
                <li>Government Authorities where legally required</li>
              </ul>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                All third parties are required to use information only for legitimate operational purposes.
              </p>
            </section>

            {/* 7. Data Security */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>7.</span> Data Security
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Reasonable technical and organizational safeguards are implemented, including:
              </p>
              <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.25rem 1rem' }}>
                <li>Secure Cloud Infrastructure</li>
                <li>HTTPS Encryption</li>
                <li>Authentication Controls</li>
                <li>Role-Based Access Control</li>
                <li>Administrative Access Restrictions</li>
                <li>Encrypted Data Transmission</li>
                <li>Database Security & Firewalls</li>
                <li>Regular Security Monitoring</li>
                <li>Backup & Recovery Mechanisms</li>
              </ul>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                Although reasonable security measures are implemented, no electronic system can guarantee absolute security.
              </p>
            </section>

            {/* 8. Data Retention */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>8.</span> Data Retention
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Personal information will be retained only for as long as necessary for conducting examinations, publishing results, issuing certificates, programme administration, audit purposes, legal compliance, and record maintenance.
              </p>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                After expiry of the applicable retention period, information may be securely deleted or anonymized.
              </p>
            </section>

            {/* 9. Children's Privacy */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>9.</span> Children's Privacy
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                The Platform is intended primarily for students, including minors. Participation generally occurs through schools, educational institutions, parents, or legal guardians.
              </p>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                Where required by applicable law, necessary consent shall be obtained through the appropriate authority.
              </p>
            </section>

            {/* 10. User Rights */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>10.</span> User Rights
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Subject to applicable law, users may request access, correction, updating, deletion, or restriction of processing of their personal information through Bharat Vikas Parishad.
              </p>
            </section>

            {/* 11. Cookies and Analytics */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>11.</span> Cookies and Analytics
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                The website and application may use cookies, technical logs, analytics tools, and diagnostic services for performance improvement, error detection, usage analytics, security monitoring, and service enhancement. Users may disable cookies through browser settings where applicable.
              </p>
            </section>

            {/* 12. Third-Party Services */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>12.</span> Third-Party Services
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                The Platform may use trusted third-party services, including Database Providers, Google Play Services, SMS Gateway Providers, Cloud Hosting Providers, and Analytics Providers. Each third-party service operates under its own privacy policy.
              </p>
            </section>

            {/* 13. OTP Communication */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>13.</span> OTP Communication
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                Mobile numbers may be used for registration verification, OTP authentication, login verification, security alerts, and examination notifications. Standard SMS charges, if any, shall be governed by the user's telecom operator.
              </p>
            </section>

            {/* 14. Account Deletion */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>14.</span> Account Deletion
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                Users may request deletion of their account where legally permissible. Certain examination records, certificates, audit logs, or information required by law may continue to be retained after account deletion.
              </p>
            </section>

            {/* 15. Changes to this Privacy Policy */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>15.</span> Changes to this Privacy Policy
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                This Privacy Policy may be updated periodically. The latest version shall always be available on <a href="https://bvpindia.org" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>https://bvpindia.org</a> and within the official Mobile Application. Continued use of the Platform constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* 16. Contact */}
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
