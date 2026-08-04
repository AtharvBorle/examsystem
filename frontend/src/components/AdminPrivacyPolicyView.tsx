import React, { useState, useEffect } from 'react'
import { ArrowLeft, ShieldCheck, FileText, Building2, ExternalLink } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { Language } from '../utils/localization'

interface AdminPrivacyPolicyViewProps {
  onBack?: () => void
  lang?: Language
  onChangeLang?: (lang: Language) => void
}

export function AdminPrivacyPolicyView({ onBack, lang = 'en', onChangeLang }: AdminPrivacyPolicyViewProps) {
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
      window.history.pushState({}, '', '/oes/admin')
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
                {isHi ? 'ऑनलाइन परीक्षा प्रशासन मंच' : 'Online Examination Administration Platform'}
              </span>
            </div>
          </div>

          <div className="info-page-header-right">
            <div className="info-page-badge">
              <ShieldCheck size={20} style={{ color: '#f2bb50' }} />
              <span className="info-page-badge-text">
                {isHi ? 'एडमिन गोपनीयता नीति' : 'Admin Privacy Policy'}
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
                {isHi ? 'एडमिन गोपनीयता नीति' : 'ADMIN PRIVACY POLICY'}
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              {isHi ? 'भारत विकास परिषद ऑनलाइन परीक्षा प्रशासन मंच के लिए' : 'For the Bharat Vikas Parishad Online Examination Administration Platform'}
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
                {isHi ? 'प्रशासक सुरक्षा ढांचा' : 'Administrator Security Framework'}
              </div>
            </div>
          </div>

          {/* Policy Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7 }}>
            
            {/* Introduction */}
            <section>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'यह गोपनीयता नीति स्पष्ट करती है कि भारत विकास परिषद ऑनलाइन परीक्षा प्रशासन मंच (Bharat Vikas Parishad Online Examination Administration Platform) के भीतर जानकारी को कैसे एकत्र, संसाधित, संग्रहीत, एक्सेस और सुरक्षित किया जाता है।' 
                  : 'This Privacy Policy explains how information is collected, processed, stored, accessed, and protected within the Bharat Vikas Parishad Online Examination Administration Platform.'}
              </p>
            </section>

            {/* 1. Information Collected */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>1.</span> {isHi ? 'एकत्र की गई जानकारी' : 'Information Collected'}
              </h2>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'यह प्लेटफॉर्म निम्नलिखित जानकारी एकत्र कर सकता है:' : 'The Platform may collect:'}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                {/* Administrator Info Card */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #0f3d7a' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0f3d7a', fontWeight: 700 }}>
                    {isHi ? 'प्रशासक की जानकारी' : 'Administrator Information'}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    <li>{isHi ? 'नाम' : 'Name'}</li>
                    <li>{isHi ? 'मोबाइल नंबर' : 'Mobile number'}</li>
                    <li>{isHi ? 'ईमेल पता' : 'Email address'}</li>
                    <li>{isHi ? 'पद' : 'Designation'}</li>
                    <li>{isHi ? 'आवंटित संगठन या शाखा' : 'Assigned organization or branch'}</li>
                    <li>{isHi ? 'लॉगिन क्रेडेंशियल (सुरक्षित रूप से संग्रहीत)' : 'Login credentials (stored securely)'}</li>
                    <li>{isHi ? 'प्रोफ़ाइल जानकारी' : 'Profile information'}</li>
                  </ul>
                </div>

                {/* Operational Info Card */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #d97706' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#92400e', fontWeight: 700 }}>
                    {isHi ? 'परिचालन संबंधी जानकारी' : 'Operational Information'}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    <li>{isHi ? 'स्कूल डेटा' : 'School data'}</li>
                    <li>{isHi ? 'यूडीआईएसई (UDISE) जानकारी' : 'UDISE information'}</li>
                    <li>{isHi ? 'छात्र पंजीकरण' : 'Student registrations'}</li>
                    <li>{isHi ? 'परीक्षा रिकॉर्ड' : 'Examination records'}</li>
                    <li>{isHi ? 'प्रश्न बैंक' : 'Question banks'}</li>
                    <li>{isHi ? 'परिणाम' : 'Results'}</li>
                    <li>{isHi ? 'प्रमाण पत्र' : 'Certificates'}</li>
                    <li>{isHi ? 'रिपोर्ट' : 'Reports'}</li>
                    <li>{isHi ? 'प्रशासनिक कार्य' : 'Administrative actions'}</li>
                  </ul>
                </div>

                {/* Technical Info Card */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#166534', fontWeight: 700 }}>
                    {isHi ? 'तकनीकी जानकारी' : 'Technical Information'}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    <li>{isHi ? 'आईपी पता' : 'IP address'}</li>
                    <li>{isHi ? 'डिवाइस की जानकारी' : 'Device information'}</li>
                    <li>{isHi ? 'ब्राउज़र विवरण' : 'Browser details'}</li>
                    <li>{isHi ? 'ऑपरेटिंग सिस्टम' : 'Operating system'}</li>
                    <li>{isHi ? 'लॉगिन टाइमस्टैम्प' : 'Login timestamps'}</li>
                    <li>{isHi ? 'सत्र की जानकारी' : 'Session information'}</li>
                    <li>{isHi ? 'गतिविधि लॉग' : 'Activity logs'}</li>
                    <li>{isHi ? 'त्रुटि लॉग' : 'Error logs'}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Purpose of Processing */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>2.</span> {isHi ? 'प्रसंस्करण का उद्देश्य' : 'Purpose of Processing'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'जानकारी को निम्नलिखित उद्देश्यों के लिए संसाधित किया जा सकता है:' : 'Information may be processed to:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.4rem 1.5rem' }}>
                <li>{isHi ? 'प्लेटफ़ॉर्म संचालित करने के लिए।' : 'Operate the Platform.'}</li>
                <li>{isHi ? 'उपयोगकर्ताओं को प्रमाणित करने के लिए।' : 'Authenticate users.'}</li>
                <li>{isHi ? 'परीक्षाओं का प्रबंधन करने के लिए।' : 'Manage examinations.'}</li>
                <li>{isHi ? 'प्रमाण पत्र और रिपोर्ट तैयार करने के लिए।' : 'Generate certificates and reports.'}</li>
                <li>{isHi ? 'तकनीकी सहायता प्रदान करने के लिए।' : 'Provide technical support.'}</li>
                <li>{isHi ? 'सुरक्षा बनाए रखने के लिए।' : 'Maintain security.'}</li>
                <li>{isHi ? 'धोखाधड़ी को रोकने के लिए।' : 'Prevent fraud.'}</li>
                <li>{isHi ? 'बैकअप लेने के लिए।' : 'Perform backups.'}</li>
                <li>{isHi ? 'प्रदर्शन में सुधार करने के लिए।' : 'Improve performance.'}</li>
                <li>{isHi ? 'विश्लेषण करने के लिए।' : 'Conduct analytics.'}</li>
                <li>{isHi ? 'परिचालन अंतर्दृष्टि उत्पन्न करने के लिए।' : 'Generate operational insights.'}</li>
                <li>{isHi ? 'प्लेटफ़ॉर्म के उपयोग को मापने के लिए।' : 'Measure platform usage.'}</li>
                <li>{isHi ? 'भविष्य के सुधारों की योजना बनाने के लिए।' : 'Plan future enhancements.'}</li>
                <li style={{ gridColumn: 'span 2' }}>
                  {isHi 
                    ? 'प्लेटफ़ॉर्म से संबंधित विपणन, जागरूकता, आउटरीच, प्रदर्शन, केस स्टडीज, प्रचार सामग्री और उत्पाद सुधार गतिविधियों का समर्थन करने के लिए, बशर्ते कि व्यक्तिगत रूप से पहचान योग्य जानकारी लागू कानून के अनुसार संभाली जाए या जहां आवश्यक हो, उचित रूप से अज्ञात (anonymized) की जाए।'
                    : 'Support marketing, awareness, outreach, demonstrations, case studies, promotional materials, and product improvement activities relating to the Platform, provided that personally identifiable information is handled in accordance with applicable law or appropriately anonymized where required.'}
                </li>
              </ul>
            </section>

            {/* 3. Super Admin Access */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>3.</span> {isHi ? 'सुपर एडमिन एक्सेस' : 'Super Admin Access'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'सुपर एडमिन (Neopace Infotech LLP) के पास निम्नलिखित उद्देश्यों के लिए प्लेटफ़ॉर्म डेटा तक पूर्ण प्रशासनिक पहुंच है:' 
                  : 'The Super Admin (Neopace Infotech LLP) has full administrative access to platform data for:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.3rem 1rem' }}>
                <li>{isHi ? 'प्लेटफ़ॉर्म प्रबंधन' : 'Platform management'}</li>
                <li>{isHi ? 'रखरखाव' : 'Maintenance'}</li>
                <li>{isHi ? 'तकनीकी सहायता' : 'Technical support'}</li>
                <li>{isHi ? 'सुरक्षा' : 'Security'}</li>
                <li>{isHi ? 'बैकअप' : 'Backups'}</li>
                <li>{isHi ? 'आपदा बहाली' : 'Disaster recovery'}</li>
                <li>{isHi ? 'विश्लेषण' : 'Analytics'}</li>
                <li>{isHi ? 'अनुपालन' : 'Compliance'}</li>
                <li>{isHi ? 'ऑडिटिंग' : 'Auditing'}</li>
                <li>{isHi ? 'सुविधा विकास' : 'Feature development'}</li>
                <li>{isHi ? 'प्रदर्शन अनुकूलन' : 'Performance optimization'}</li>
                <li>{isHi ? 'माइग्रेशन गतिविधियां' : 'Migration activities'}</li>
              </ul>
            </section>

            {/* 4. Data Storage */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>4.</span> {isHi ? 'डेटा भंडारण' : 'Data Storage'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'डेटा को नियोपेस इन्फोटेक एलएलपी (Neopace Infotech LLP) द्वारा या उसकी ओर से बनाए गए सुरक्षित क्लाउड या प्रबंधित सर्वर इंफ्रास्ट्रक्चर पर संग्रहीत किया जा सकता है। अनधिकृत पहुंच, परिवर्तन या प्रकटीकरण से जानकारी की सुरक्षा के लिए उचित तकनीकी और संगठनात्मक सुरक्षा उपाय लागू किए गए हैं।' 
                  : 'Data may be stored on secure cloud or managed server infrastructure maintained by or on behalf of Neopace Infotech LLP. Appropriate technical and organizational safeguards are implemented to protect information from unauthorized access, alteration, or disclosure.'}
              </p>
            </section>

            {/* 5. Data Sharing */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>5.</span> {isHi ? 'डेटा साझा करना' : 'Data Sharing'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'जानकारी निम्नलिखित मामलों में साझा की जा सकती है:' : 'Information may be shared:'}
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem' }}>
                <li>
                  {isHi 
                    ? 'भारत विकास परिषद और उसके अधिकृत प्रशासकों के साथ।' 
                    : 'With Bharat Vikas Parishad and its authorized administrators.'}
                </li>
                <li>
                  {isHi 
                    ? 'उचित गोपनीयता दायित्वों के तहत होस्टिंग, मैसेजिंग, एनालिटिक्स, रखरखाव, या तकनीकी संचालन के लिए लगे विश्वसनीय बुनियादी ढांचे या सेवा प्रदाताओं के साथ।' 
                    : 'With trusted infrastructure or service providers engaged for hosting, messaging, analytics, maintenance, or technical operations under appropriate confidentiality obligations.'}
                </li>
                <li>
                  {isHi 
                    ? 'जब लागू कानून, विनियमन, या वैध सरकारी अनुरोध द्वारा आवश्यक हो।' 
                    : 'When required by applicable law, regulation, or lawful governmental request.'}
                </li>
              </ul>
              <p style={{ margin: 0, color: '#0f3d7a', fontWeight: 'bold', fontSize: '0.95rem' }}>
                {isHi ? '★ व्यक्तिगत जानकारी किसी भी तीसरे पक्ष को नहीं बेची जाती है।' : '★ Information is not sold to third parties.'}
              </p>
            </section>

            {/* 6. Security */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>6.</span> {isHi ? 'सुरक्षा' : 'Security'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'उचित प्रशासनिक, तकनीकी और भौतिक सुरक्षा उपाय लागू किए गए हैं, जिसमें पहुंच नियंत्रण (access controls), प्रमाणीकरण (authentication), जहां लागू हो एन्क्रिप्टेड संचार (encrypted communications), लॉगिंग, निगरानी, बैकअप और आवधिक सुरक्षा अपडेट शामिल हैं।' 
                  : 'Reasonable administrative, technical, and physical safeguards are implemented, including access controls, authentication, encrypted communications where applicable, logging, monitoring, backups, and periodic security updates.'}
              </p>
            </section>

            {/* 7. Data Retention */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>7.</span> {isHi ? 'डेटा प्रतिधारण' : 'Data Retention'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'जानकारी को तब तक प्रतिधारित (retained) किया जा सकता है जब तक परिचालन, संविदात्मक, कानूनी, ऑडिट, अभिलेखीय, विवाद समाधान, या वैध व्यावसायिक उद्देश्यों के लिए आवश्यक हो, जब तक कि कानून द्वारा या संविदात्मक रूप से सहमत एक अलग प्रतिधारण अवधि की आवश्यकता न हो।' 
                  : 'Information may be retained as long as necessary for operational, contractual, legal, audit, archival, dispute resolution, or legitimate business purposes, unless a different retention period is required by law or agreed contractually.'}
              </p>
            </section>

            {/* 8. Administrator Responsibilities */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>8.</span> {isHi ? 'प्रशासक की जिम्मेदारियां' : 'Administrator Responsibilities'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'प्रशासक निम्नलिखित कार्यों के लिए जिम्मेदार हैं:' : 'Administrators are responsible for:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.3rem 1rem' }}>
                <li>{isHi ? 'पासवर्ड की गोपनीयता बनाए रखना।' : 'Maintaining password confidentiality.'}</li>
                <li>{isHi ? 'जहां व्यावहारिक हो केवल अधिकृत उपकरणों का उपयोग करना।' : 'Using only authorized devices where practical.'}</li>
                <li>{isHi ? 'छात्रों की जानकारी की रक्षा करना।' : 'Protecting student information.'}</li>
                <li>{isHi ? 'सटीक डेटा अपलोड करना।' : 'Uploading accurate data.'}</li>
                <li>{isHi ? 'लागू कानूनों और संगठनात्मक नीतियों का अनुपालन करना।' : 'Complying with applicable laws and organizational policies.'}</li>
                <li>{isHi ? 'संदिग्ध अनधिकृत पहुंच की तुरंत रिपोर्ट करना।' : 'Promptly reporting suspected unauthorized access.'}</li>
              </ul>
            </section>

            {/* 9. Policy Updates */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>9.</span> {isHi ? 'नीति अपडेट' : 'Policy Updates'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'इस गोपनीयता नीति को समय-समय पर संशोधित किया जा सकता है। अद्यतन संस्करण प्लेटफ़ॉर्म के भीतर प्रकाशन या अन्य उचित अधिसूचना प्राप्त होने पर प्रभावी हो जाते हैं।' 
                  : 'This Privacy Policy may be revised periodically. Updated versions become effective upon publication within the Platform or other appropriate notification.'}
              </p>
            </section>

            {/* 10. Contact */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>10.</span> {isHi ? 'संपर्क' : 'Contact'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'तकनीकी सहायता, गोपनीयता से संबंधित प्रश्नों, या प्लेटफ़ॉर्म प्रशासन मामलों के लिए, प्रशासकों को नियोपेस इन्फोटेक एलएलपी की निर्दिष्ट सहायता टीम से मेल आईडी: info@neopaceinfotech.com पर संपर्क करना चाहिए।' 
                  : 'For technical support, privacy-related queries, or platform administration matters, administrators should contact the designated support team of Neopace Infotech LLP on Mail ID : info@neopaceinfotech.com'}
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
