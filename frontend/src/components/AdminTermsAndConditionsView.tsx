import React, { useState, useEffect } from 'react'
import { ArrowLeft, ShieldCheck, FileText, Building2, ExternalLink } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { Language } from '../utils/localization'

interface AdminTermsAndConditionsViewProps {
  onBack?: () => void
  lang?: Language
  onChangeLang?: (lang: Language) => void
}

export function AdminTermsAndConditionsView({ onBack, lang = 'en', onChangeLang }: AdminTermsAndConditionsViewProps) {
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
                {isHi ? 'एडमिन नियम और शर्तें' : 'Admin Terms & Conditions'}
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
                {isHi ? 'एडमिन नियम एवं शर्तें' : 'ADMIN TERMS AND CONDITIONS'}
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              {isHi ? 'भारत विकास परिषद ऑनलाइन परीक्षा प्रशासन मंच के लिए' : 'For the Bharat Vikas Parishad Online Examination Administration Platform'}
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
            
            {/* Intro */}
            <section>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'भारत विकास परिषद ऑनलाइन परीक्षा प्रशासन पोर्टल ("मंच") में आपका स्वागत है। एक प्रशासक (Administrator) के रूप में मंच तक पहुँचने या उसका उपयोग करके, आप इन नियमों और शर्तों का अनुपालन करने और कानूनी रूप से बाध्य होने के लिए सहमत होते हैं।'
                  : 'Welcome to the Bharat Vikas Parishad Online Examination Administration Portal ("Platform"). By accessing or using the Platform as an Administrator, you agree to comply with and be legally bound by these Terms & Conditions.'}
              </p>
            </section>

            {/* 1. Definitions */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>1.</span> {isHi ? 'परिभाषाएं' : 'Definitions'}
              </h2>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>
                  <strong>{isHi ? 'मंच (Platform):' : 'Platform'}</strong> {isHi ? 'से तात्पर्य भारत विकास परिषद ऑनलाइन परीक्षा प्रणाली से है।' : 'refers to the Bharat Vikas Parishad Online Examination System.'}
                </li>
                <li>
                  <strong>{isHi ? 'सुपर एडमिन (Super Admin):' : 'Super Admin'}</strong> {isHi ? 'से तात्पर्य नियोपेस इन्फोटेक एलएलपी (Neopace Infotech LLP) से है, जो मंच का तकनीकी मालिक, डेवलपर, रखरखावकर्ता और संचालक है।' : 'refers to Neopace Infotech LLP, the technical owner, developer, maintainer, and operator of the Platform.'}
                </li>
                <li>
                  <strong>{isHi ? 'एडमिन (Admin):' : 'Admin'}</strong> {isHi ? 'से तात्पर्य सुपर एडमिन द्वारा परीक्षाओं और संबंधित डेटा का प्रबंधन करने के लिए दी गई पहुंच वाले अधिकृत उपयोगकर्ता से है।' : 'refers to an authorized user granted access by the Super Admin to manage examinations and related data.'}
                </li>
                <li>
                  <strong>{isHi ? 'संगठन (Organization):' : 'Organization'}</strong> {isHi ? 'से तात्पर्य भारत विकास परिषद और उसकी अधिकृत शाखाओं से है जो मंच का उपयोग कर रही हैं।' : 'refers to Bharat Vikas Parishad and its authorized branches using the Platform.'}
                </li>
              </ul>
            </section>

            {/* 2. Acceptance */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>2.</span> {isHi ? 'स्वीकृति' : 'Acceptance'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'एडमिन पोर्टल में लॉग इन करके, आप स्वीकार करते हैं कि आपने इन नियमों और शर्तों को पढ़, समझ लिया है और इनसे सहमत हैं।' 
                  : 'By logging into the Admin Portal, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.'}
              </p>
            </section>

            {/* 3. Ownership of the Platform */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>3.</span> {isHi ? 'मंच का स्वामित्व' : 'Ownership of the Platform'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'सॉफ्टवेयर प्लेटफॉर्म, एप्लिकेशन, सोर्स कोड, एपीआई (APIs), आर्किटेक्चर, डेटाबेस, परिनियोजन (deployment) बुनियादी ढांचा, डैशबोर्ड, रिपोर्ट, डिजाइन, वर्कफ़्लो, तकनीकी दस्तावेज और सभी संबंधित बौद्धिक संपदा नियोपेस इन्फोटेक एलएलपी के स्वामित्व और प्रबंधन में हैं।' 
                  : 'The software platform, application, source code, APIs, architecture, databases, deployment infrastructure, dashboards, reports, designs, workflows, technical documentation, and all related intellectual property are owned and managed by Neopace Infotech LLP.'}
              </p>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi
                  ? 'संगठन को दोनों पक्षों के बीच व्यावसायिक समझौते के अनुसार मंच का उपयोग करने का लाइसेंस प्रदान किया जाता है। सॉफ्टवेयर या अंतर्निहित तकनीक में कोई स्वामित्व अधिकार हस्तांतरित नहीं किया जाता है।'
                  : 'The Organization is granted a license to use the Platform in accordance with the commercial agreement between the parties. No ownership rights in the software or underlying technology are transferred.'}
              </p>
            </section>

            {/* 4. Administrative Access */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>4.</span> {isHi ? 'प्रशासनिक पहुंच' : 'Administrative Access'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'सुपर एडमिन के पास अप्रतिबंधित प्रशासनिक विशेषाधिकार हैं, जिसमें निम्नलिखित शामिल हैं लेकिन इन्हीं तक सीमित नहीं हैं:' 
                  : 'The Super Admin has unrestricted administrative privileges, including but not limited to:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.35rem 1rem' }}>
                <li>{isHi ? 'सभी सिस्टम डेटा देखना।' : 'Viewing all system data.'}</li>
                <li>{isHi ? 'एडमिन खातों का प्रबंधन करना।' : 'Managing Admin accounts.'}</li>
                <li>{isHi ? 'एडमिन खातों का निर्माण, संशोधन, निलंबन या विलोपन करना।' : 'Creating, modifying, suspending, or deleting Admin accounts.'}</li>
                <li>{isHi ? 'सिस्टम गतिविधि की निगरानी करना।' : 'Monitoring system activity.'}</li>
                <li>{isHi ? 'लॉग और ऑडिट रिकॉर्ड तक पहुंचना।' : 'Accessing logs and audit records.'}</li>
                <li>{isHi ? 'स्कूलों, परीक्षाओं, प्रश्नों, परिणामों, प्रमाणपत्रों और उपयोगकर्ता रिकॉर्ड का प्रबंधन करना।' : 'Managing schools, examinations, questions, results, certificates, and user records.'}</li>
                <li>{isHi ? 'रखरखाव, अपग्रेड, माइग्रेशन, बैकअप और रिकवरी संचालन करना।' : 'Performing maintenance, upgrades, migrations, backups, and recovery operations.'}</li>
              </ul>
            </section>

            {/* 5. Data Management */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>5.</span> {isHi ? 'डेटा प्रबंधन' : 'Data Management'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'एडमिन निम्नलिखित जानकारी अपलोड, संशोधित या प्रबंधित कर सकते हैं:' 
                  : 'Admins may upload, modify, or manage information including:'}
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.25rem 1rem' }}>
                <li>• {isHi ? 'स्कूल' : 'Schools'}</li>
                <li>• {isHi ? 'छात्र' : 'Students'}</li>
                <li>• {isHi ? 'शिक्षक' : 'Teachers'}</li>
                <li>• {isHi ? 'परीक्षा सामग्री' : 'Examination content'}</li>
                <li>• {isHi ? 'प्रश्न' : 'Questions'}</li>
                <li>• {isHi ? 'परिणाम' : 'Results'}</li>
                <li>• {isHi ? 'प्रमाण पत्र' : 'Certificates'}</li>
                <li>• {isHi ? 'रिपोर्ट' : 'Reports'}</li>
              </ul>
              <p style={{ margin: '0.5rem 0 0 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'एडमिन यह सुनिश्चित करने के लिए जिम्मेदार हैं कि सभी अपलोड की गई जानकारी सटीक, कानूनी और अधिकृत हो।' 
                  : 'Admins are responsible for ensuring that all uploaded information is accurate, lawful, and authorized.'}
              </p>
            </section>

            {/* 6. Acceptable Use */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>6.</span> {isHi ? 'स्वीकार्य उपयोग' : 'Acceptable Use'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi ? 'एडमिन निम्नलिखित कार्य नहीं करेंगे:' : 'Admins shall not:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.975rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.35rem 1rem' }}>
                <li>{isHi ? 'लॉगिन क्रेडेंशियल साझा करना।' : 'Share login credentials.'}</li>
                <li>{isHi ? 'अनधिकृत पहुंच का प्रयास करना।' : 'Attempt unauthorized access.'}</li>
                <li>{isHi ? 'सिस्टम सुरक्षा को संशोधित करना।' : 'Modify system security.'}</li>
                <li>{isHi ? 'दुर्भावनापूर्ण फ़ाइलें अपलोड करना।' : 'Upload malicious files.'}</li>
                <li>{isHi ? 'छात्र या स्कूल की जानकारी का दुरुपयोग करना।' : 'Misuse student or school information.'}</li>
                <li>{isHi ? 'मंच की नकल या रिवर्स इंजीनियर करना।' : 'Copy or reverse engineer the Platform.'}</li>
                <li>{isHi ? 'मंच के प्रतिबंधों को दरकिनार करना।' : 'Circumvent platform restrictions.'}</li>
              </ul>
            </section>

            {/* 7. Monitoring and Audit */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>7.</span> {isHi ? 'निगरानी और ऑडिट' : 'Monitoring and Audit'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'सुरक्षा, गुणवत्ता आश्वासन, विश्लेषण, समस्या निवारण, अनुपालन और परिचालन उद्देश्यों के लिए, सभी प्रशासनिक गतिविधियों को लॉग और मॉनिटर किया जा सकता है।' 
                  : 'For security, quality assurance, analytics, troubleshooting, compliance, and operational purposes, all administrative activities may be logged and monitored.'}
              </p>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi
                  ? 'ऑडिट लॉग में लॉगिन गतिविधि, आईपी पता, ब्राउज़र विवरण, डिवाइस की जानकारी, की गई कार्रवाई, अपलोड, संशोधन, विलोपन और अन्य प्रशासनिक कार्यक्रम शामिल हो सकते हैं।'
                  : 'Audit logs may include login activity, IP address, browser details, device information, actions performed, uploads, modifications, deletions, and other administrative events.'}
              </p>
            </section>

            {/* 8. Analytics and Platform Improvement */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>8.</span> {isHi ? 'एनालिटिक्स और प्लेटफ़ॉर्म सुधार' : 'Analytics and Platform Improvement'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'नियोपेस इन्फोटेक एलएलपी (Neopace Infotech LLP) प्रशासनिक और परिचालन डेटा को निम्नलिखित उद्देश्यों के लिए संसाधित कर सकता है:' 
                  : 'Neopace Infotech LLP may process administrative and operational data to:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.35rem 1rem' }}>
                <li>{isHi ? 'प्लेटफ़ॉर्म के प्रदर्शन में सुधार करना।' : 'Improve platform performance.'}</li>
                <li>{isHi ? 'उपयोग के रुझानों का विश्लेषण करना।' : 'Analyze usage trends.'}</li>
                <li>{isHi ? 'अपनाए जाने (adoption) की निगरानी करना।' : 'Monitor adoption.'}</li>
                <li>{isHi ? 'परिचालन अंतर्दृष्टि उत्पन्न करना।' : 'Generate operational insights.'}</li>
                <li>{isHi ? 'सिस्टम की विश्वसनीयता बढ़ाना।' : 'Enhance system reliability.'}</li>
                <li>{isHi ? 'अज्ञात सांख्यिकीय रिपोर्ट तैयार करना।' : 'Produce anonymized statistical reports.'}</li>
                <li>{isHi ? 'उपयोगकर्ता अनुभव में सुधार करना।' : 'Improve user experience.'}</li>
              </ul>
              <p style={{ margin: '0.5rem 0 0 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi
                  ? 'ऐसा प्रसंस्करण कानूनी रूप से अधिकृत या आवश्यक होने के अलावा संगठनात्मक गोपनीय जानकारी का जानबूझकर खुलासा नहीं करेगा।'
                  : 'Such processing will not intentionally disclose confidential organizational information except where authorized or required by law.'}
              </p>
            </section>

            {/* 9. Communication */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>9.</span> {isHi ? 'संचार' : 'Communication'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'सुपर एडमिन एडमिन से निम्नलिखित के संबंध में संवाद कर सकता है:' 
                  : 'The Super Admin may communicate with Admins regarding:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.3rem 1rem' }}>
                <li>• {isHi ? 'सिस्टम अपडेट' : 'System updates'}</li>
                <li>• {isHi ? 'रखरखाव के समय (Maintenance windows)' : 'Maintenance windows'}</li>
                <li>• {isHi ? 'सुरक्षा अलर्ट' : 'Security alerts'}</li>
                <li>• {isHi ? 'नई सुविधाओं की रिलीज़' : 'Feature releases'}</li>
                <li>• {isHi ? 'नीतिगत बदलाव' : 'Policy changes'}</li>
                <li>• {isHi ? 'परिचालन संबंधी सूचनाएं' : 'Operational notices'}</li>
              </ul>
            </section>

            {/* 10. Suspension or Termination */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>10.</span> {isHi ? 'निलंबन या समाप्ति' : 'Suspension or Termination'}
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'सुपर एडमिन एडमिन की पहुंच को निलंबित या रद्द कर सकता है यदि निम्नलिखित गतिविधियाँ होती हैं:' 
                  : 'The Super Admin may suspend or revoke Admin access if there is:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.3rem 1rem' }}>
                <li>{isHi ? 'अनधिकृत उपयोग' : 'Unauthorized usage'}</li>
                <li>{isHi ? 'सुरक्षा उल्लंघन' : 'Security violations'}</li>
                <li>{isHi ? 'डेटा का दुरुपयोग' : 'Data misuse'}</li>
                <li>{isHi ? 'धोखाधड़ी वाली गतिविधि' : 'Fraudulent activity'}</li>
                <li>{isHi ? 'इन शर्तों का उल्लंघन' : 'Breach of these Terms'}</li>
                <li>{isHi ? 'कानूनी या संविदात्मक आवश्यकताएं' : 'Legal or contractual requirements'}</li>
              </ul>
            </section>

            {/* 11. Limitation of Liability */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>11.</span> {isHi ? 'दायित्व की सीमा' : 'Limitation of Liability'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'हालांकि निर्बाध सेवा सुनिश्चित करने के लिए उचित प्रयास किए जाते हैं, नियोपेस इन्फोटेक एलएलपी (Neopace Infotech LLP) डाउनटाइम, इंटरनेट विफलताओं, तीसरे पक्ष की सेवाओं, या अप्रत्याशित घटनाओं (force majeure) से होने वाले अप्रत्यक्ष, आकस्मिक या परिणामी नुकसान के लिए उत्तरदायी नहीं होगा।' 
                  : 'While reasonable efforts are made to ensure uninterrupted service, Neopace Infotech LLP shall not be liable for indirect, incidental, or consequential losses arising from downtime, internet failures, third-party services, or force majeure events.'}
              </p>
            </section>

            {/* 12. Intellectual Property */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>12.</span> {isHi ? 'बौद्धिक संपदा' : 'Intellectual Property'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'सभी सॉफ़्टवेयर, इंटरफेस, कोड, दस्तावेज़ीकरण, ग्राफ़िक्स, रिपोर्ट, एपीआई, वर्कफ़्लो और संबंधित सामग्री नियोपेस इन्फोटेक एलएलपी की विशिष्ट बौद्धिक संपदा बनी रहेगी जब तक कि लिखित रूप में अलग से सहमति न हो।' 
                  : 'All software, interfaces, code, documentation, graphics, reports, APIs, workflows, and related materials remain the exclusive intellectual property of Neopace Infotech LLP unless otherwise agreed in writing.'}
              </p>
            </section>

            {/* 13. Amendments */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>13.</span> {isHi ? 'संशोधन' : 'Amendments'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'इन शर्तों को समय-समय पर अपडेट किया जा सकता है। संशोधनों के बाद मंच का निरंतर उपयोग अद्यतन शर्तों की स्वीकृति माना जाएगा।' 
                  : 'These Terms may be updated periodically. Continued use of the Platform after revisions constitutes acceptance of the updated Terms.'}
              </p>
            </section>

            {/* 14. Governing Law */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c59f2d' }}>14.</span> {isHi ? 'शासी कानून' : 'Governing Law'}
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                {isHi 
                  ? 'ये शर्तें भारत के कानूनों द्वारा शासित होंगी। कोई भी विवाद पक्षों के बीच सहमत अधिकार क्षेत्र या भारत में सक्षम न्यायालयों के अधीन होगा।' 
                  : 'These Terms shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction agreed upon between the parties or the competent courts in India.'}
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
