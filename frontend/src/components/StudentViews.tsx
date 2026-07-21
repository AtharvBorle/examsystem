import React, { useState, useEffect, useRef } from 'react'
import { translations, Language } from '../utils/localization'
import { useAuth, User } from '../context/AuthContext'
import { generateCertificatePDF } from '../utils/pdfGenerator'
import { renderContent } from '../utils/contentRenderer'
import { 
  Award, Clock, Award as TrophyIcon, CheckCircle, ChevronLeft, ChevronRight,
  GraduationCap, Building2, Calendar, FileEdit, LogOut, FileText, Check, Home
} from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import downloadCertBg from '../assets/rss_download_cert.png'
import webDashboardBg from '../assets/rss_web_dashboard.png'

/* ==========================================
   VIEW: STUDENT DASHBOARD
   ========================================== */
export function StudentDashboard({ token, user, lang, onChangeLang, onLogout }: { token: string | null; user: User; lang: Language; onChangeLang: (lang: Language) => void; onLogout?: () => void }) {
  const [exams, setExams] = useState<any[]>([])
  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [completedAttempt, setCompletedAttempt] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [startingExamId, setStartingExamId] = useState<string | null>(null)

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/student/exams', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setExams(data.exams)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [token, user.language])

  const handleStartExam = async (examId: string) => {
    setError('')
    setStartingExamId(examId)
    try {
      const res = await fetch('/api/student/exams/attempt/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ examId }),
      })
      const data = await res.json()
      if (data.success) {
        // Set active session config
        setActiveSession({
          attemptId: data.attemptId,
          examId: examId,
          questions: data.questions,
          responses: data.responses || {},
          startedAt: new Date(data.startedAt),
          duration: data.duration, // In minutes
          examName: exams.find((e) => e.id === examId)?.name || 'Examination',
          language: exams.find((e) => e.id === examId)?.language || 'en',
        })
      } else {
        setError(data.error || 'Failed to start exam.')
      }
    } catch (err) {
      setError('Connection to server failed.')
    } finally {
      setStartingExamId(null)
    }
  }

  const handleFinishExamSubmit = async (attemptId: string, responses: any) => {
    try {
      const res = await fetch('/api/student/exams/attempt/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attemptId, responses, language: lang }),
      })
      const data = await res.json()
      if (data.success) {
        try {
          localStorage.removeItem(`exam_responses_${attemptId}`)
        } catch (e) {
          console.error(e)
        }
        // Exam submitted successfully! Set completion view metadata
        setCompletedAttempt({
          attemptId,
          studentName: user.name || 'Student',
          schoolName: user.school?.name || 'School',
          classroomName: user.classroom?.name || 'Classroom',
          examName: activeSession?.examName || 'Examination',
          completedAt: data.submittedAt,
          language: activeSession?.language || 'en',
        })
        setActiveSession(null)
        fetchExams()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCertificateDownload = () => {
    const baseData = completedAttempt || {
      studentName: user.name || 'Student',
      schoolName: user.school?.name || 'School',
      classroomName: user.classroom?.name || 'Classroom',
      examName: 'Examination',
      completedAt: new Date(),
    }
    if (typeof window !== 'undefined' && (window as any).showCustomAlert) {
      (window as any).showCustomAlert(lang === 'hi'
        ? 'आपका प्रमाण पत्र तैयार किया जा रहा है। इसे जल्द ही डाउनलोड/सहेज लिया जाएगा।'
        : 'Generating your certificate. It will be downloaded/saved shortly.'
      );
    } else {
      window.alert(lang === 'hi'
        ? 'आपका प्रमाण पत्र तैयार किया जा रहा है। इसे जल्द ही डाउनलोड/सहेज लिया जाएगा।'
        : 'Generating your certificate. It will be downloaded/saved shortly.'
      );
    }
    generateCertificatePDF({
      ...baseData,
      language: lang,
    })
  }

  const t = translations[lang]

  if (activeSession) {
    return (
      <ExamSessionView
        session={activeSession}
        exams={exams}
        onSubmit={handleFinishExamSubmit}
        lang={lang}
        onChangeLang={onChangeLang}
      />
    )
  }

  if (completedAttempt) {
    return (
      <div 
        className="completed-attempt-fullscreen" 
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `url(${downloadCertBg})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          padding: '2rem 1.5rem',
          boxSizing: 'border-box'
        }}
      >
        {/* Success Checkmark Circle */}
        <div 
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            border: '4px solid #147a33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            marginBottom: '2rem',
            boxSizing: 'border-box'
          }}
        >
          <Check size={48} strokeWidth={4} style={{ color: '#147a33' }} />
        </div>

        {/* Congratulations Heading */}
        <h2 
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: '2.2rem',
            fontWeight: 700,
            color: '#102a5c',
            marginBottom: '1rem',
            textAlign: 'center',
            letterSpacing: '-0.01em'
          }}
        >
          {lang === 'hi' ? 'बधाई हो!' : 'Congratulations!'}
        </h2>

        {/* Success Description Text */}
        <p 
          style={{
            fontSize: '1.05rem',
            color: '#4a5568',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
            textAlign: 'center',
            maxWidth: '440px',
            fontWeight: 500,
            fontFamily: 'var(--font-sans, sans-serif)'
          }}
        >
          {lang === 'hi' 
            ? 'आपने सफलतापूर्वक परीक्षा पूरी कर ली है और जमा कर दी है। आपकी भागीदारी डेटाबेस सिस्टम में दर्ज कर ली गई है।' 
            : 'You have successfully completed and submitted the examination. Your participation has been recorded in the database system.'}
        </p>

        {/* Buttons Action Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
          <button
            onClick={() => handleCertificateDownload()}
            style={{
              backgroundColor: '#0b2240',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              height: '56px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 4px 10px rgba(11, 34, 64, 0.2)',
              outline: 'none',
              width: '100%'
            }}
          >
            <Award size={20} /> {lang === 'hi' ? 'प्रमाण पत्र डाउनलोड करें' : 'DOWNLOAD PARTICIPATION CERTIFICATE'}
          </button>
          
          <button
            onClick={() => setCompletedAttempt(null)}
            style={{
              border: '1px solid #f2bb50',
              backgroundColor: '#ffffff',
              color: '#0b2240',
              borderRadius: '12px',
              height: '56px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              outline: 'none',
              width: '100%'
            }}
          >
            <Home size={20} style={{ color: '#f2bb50' }} /> {lang === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'BACK TO DASHBOARD'}
          </button>
        </div>
      </div>
    )
  }

  const isNew = import.meta.env.VITE_SPLASH_SCREEN_VERSION === 'new'

  if (isDesktop) {
    return (
      <div 
        className="desktop-dashboard-fullscreen" 
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundImage: `url(${webDashboardBg})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          padding: '2.5rem 4rem',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top bar with LanguageSelector and Logout button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', marginBottom: '2rem', gap: '16px' }}>
          <LanguageSelector lang={lang} onChangeLang={onChangeLang} isDark={false} />
          {onLogout && (
            <button 
              onClick={onLogout} 
              style={{
                background: '#ffffff',
                border: '1px solid #dcd1ba',
                borderRadius: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#8c6239',
                boxShadow: '0 2px 4px rgba(140, 98, 57, 0.05)',
                outline: 'none'
              }}
              title={lang === 'hi' ? 'लॉगआउट' : 'Logout'}
            >
              <LogOut size={20} />
            </button>
          )}
        </div>

        {/* Header section with Welcome and Student Name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <p style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '1.5rem',
            fontWeight: 500,
            color: '#8c6239',
            margin: 0,
            lineHeight: 1.2
          }}>
            {lang === 'hi' ? 'स्वागत है,' : 'Welcome,'}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: '3.5rem',
            fontWeight: 700,
            color: '#0b2240',
            margin: '0.25rem 0 0 0',
            lineHeight: 1.1
          }}>
            {user.name}
          </h1>
        </div>

        {/* Info Cards Row */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(197, 160, 89, 0.25)',
            borderRadius: '12px',
            padding: '16px 28px',
            boxShadow: '0 4px 10px rgba(197, 160, 89, 0.05)'
          }}>
            <GraduationCap size={28} style={{ color: '#8c6239' }} />
            <span style={{ fontSize: '1.1rem', color: '#0b2240', fontWeight: 500 }}>
              {lang === 'hi' ? 'कक्षा' : 'Class'}: <strong style={{ fontWeight: 700 }}>{user.classroom?.name || (lang === 'hi' ? '9वीं कक्षा' : '9th Standard')}</strong>
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(197, 160, 89, 0.25)',
            borderRadius: '12px',
            padding: '16px 28px',
            boxShadow: '0 4px 10px rgba(197, 160, 89, 0.05)'
          }}>
            <Building2 size={28} style={{ color: '#8c6239' }} />
            <span style={{ fontSize: '1.1rem', color: '#0b2240', fontWeight: 500 }}>
              {lang === 'hi' ? 'विद्यालय' : 'School'}: <strong style={{ fontWeight: 700 }}>{user.school?.name || (lang === 'hi' ? 'न्यू एरा जूनियर कॉलेज' : 'New Era Jr. College')}</strong>
            </span>
          </div>
        </div>

        {/* Section title "My Examination" with gold lotus divider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0b2240',
            margin: 0
          }}>
            {lang === 'hi' ? 'मेरी परीक्षा' : 'My Examination'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <div style={{ width: '60px', height: '2px', background: '#c59f2d' }}></div>
            <svg viewBox="0 0 100 100" style={{ width: '24px', height: '24px', fill: '#d4af37' }}>
              <path d="M50 20 C40 35, 45 65, 50 80 C55 65, 60 35, 50 20 Z" />
              <path d="M50 35 C30 45, 25 70, 42 80 C40 70, 42 55, 50 35 Z" />
              <path d="M50 35 C70 45, 75 70, 58 80 C60 70, 58 55, 50 35 Z" />
              <path d="M50 50 C20 55, 12 75, 34 82 C30 75, 36 65, 50 50 Z" />
              <path d="M50 50 C80 55, 88 75, 66 82 C70 75, 64 65, 50 50 Z" />
            </svg>
            <div style={{ width: '60px', height: '2px', background: 'linear-gradient(to right, #c59f2d, transparent)' }}></div>
          </div>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '600px' }}>{error}</div>}

        {exams.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid rgba(197, 160, 89, 0.2)',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            color: '#a0aec0',
            fontSize: '1.1rem'
          }}>
            {t.noExams}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1200px' }}>
            {exams.map((ex) => (
              <div key={ex.id} style={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                borderRadius: '16px',
                padding: '24px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
              }}>
                {/* Left Column: Exam Name */}
                <div style={{ flex: 1, paddingRight: '24px' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: '#0b2240',
                    margin: 0,
                    lineHeight: 1.3,
                    textTransform: 'uppercase'
                  }}>
                    {ex.name}
                  </h3>
                </div>

                {/* Vertical Divider */}
                <div style={{ width: '1px', height: '80px', backgroundColor: '#e2d5c5', margin: '0 32px' }}></div>

                {/* Middle Column: Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '240px' }}>
                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={22} style={{ color: '#0b2240' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', color: '#8c6239', fontWeight: 600 }}>
                        {lang === 'hi' ? 'परीक्षा तिथि' : 'Exam Date'}
                      </span>
                      <span style={{ fontSize: '1.05rem', color: '#0b2240', fontWeight: 700 }}>
                        {new Date(ex.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {/* Duration */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={22} style={{ color: '#0b2240' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', color: '#8c6239', fontWeight: 600 }}>
                        {lang === 'hi' ? 'अवधि' : 'Duration'}
                      </span>
                      <span style={{ fontSize: '1.05rem', color: '#0b2240', fontWeight: 700 }}>
                        {ex.duration} {lang === 'hi' ? 'मिनट' : 'Min'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Take Exam Button */}
                <div style={{ minWidth: '220px', display: 'flex', justifyContent: 'flex-end', marginLeft: '24px' }}>
                  {ex.attemptStatus === 'COMPLETED' ? (
                    <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
                      <div style={{
                        backgroundColor: '#147a33',
                        color: '#ffffff',
                        height: '52px',
                        padding: '0 24px',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexGrow: 1
                      }}>
                        {t.completed}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/student/exams/attempt/${ex.attemptId}/certificate`, {
                              headers: { Authorization: `Bearer ${token}` }
                            })
                            const data = await res.json()
                            if (data.success) {
                              setCompletedAttempt(data.certificate)
                            }
                          } catch (err) {
                            console.error(err)
                          }
                        }}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #f2bb50',
                          color: '#0b2240',
                          width: '52px',
                          height: '52px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                        title="Certificate Details"
                      >
                        <Award size={22} style={{ color: '#f2bb50' }} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartExam(ex.id)}
                      disabled={startingExamId !== null}
                      style={{
                        backgroundColor: '#0b2240',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        height: '52px',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(11, 34, 64, 0.15)',
                        outline: 'none'
                      }}
                    >
                      {startingExamId === ex.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="spinner-small" style={{ borderColor: '#ffffff', borderTopColor: 'transparent' }}></span>
                          <span>{lang === 'hi' ? 'शुरू हो रहा है...' : 'Loading...'}</span>
                        </div>
                      ) : (
                        <>
                          <FileEdit size={20} style={{ color: '#f5d782' }} />
                          <span>{lang === 'hi' ? 'परीक्षा दें' : 'TAKE EXAM'}</span>
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isNew) {
    return (
      <div className="mobile-dashboard-container">
        {/* Top bar with LanguageSelector and Logout button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', marginBottom: '1rem', gap: '12px' }}>
          <LanguageSelector lang={lang} onChangeLang={onChangeLang} isDark={false} />
          {onLogout && (
            <button 
              onClick={onLogout} 
              style={{
                background: '#ffffff',
                border: '1px solid #dcd1ba',
                borderRadius: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#8c6239',
                boxShadow: '0 2px 4px rgba(140, 98, 57, 0.05)',
                outline: 'none'
              }}
              title={lang === 'hi' ? 'लॉगआउट' : 'Logout'}
            >
              <LogOut size={20} />
            </button>
          )}
        </div>

        {/* Header section with Welcome, and Student Name */}
        <div className="mobile-dashboard-header">
          <p className="welcome-text">{lang === 'hi' ? 'स्वागत है,' : 'Welcome,'}</p>
          <h1 className="student-name">{user.name}</h1>
        </div>

        {/* Info Rows */}
        <div className="info-row-card">
          <div className="icon-col">
            <GraduationCap size={24} />
          </div>
          <div className="text-col">
            {lang === 'hi' ? 'कक्षा' : 'Class'}: <strong>{user.classroom?.name || (lang === 'hi' ? '9वीं कक्षा' : '9th Standard')}</strong>
          </div>
        </div>

        <div className="info-row-card">
          <div className="icon-col">
            <Building2 size={24} />
          </div>
          <div className="text-col">
            {lang === 'hi' ? 'विद्यालय' : 'School'}: <strong>{user.school?.name || (lang === 'hi' ? 'न्यू एरा जूनियर कॉलेज' : 'New Era Jr. College')}</strong>
          </div>
        </div>

        {/* Section title "My Examination" with gold lotus divider */}
        <div className="mobile-section-title">
          {lang === 'hi' ? 'मेरी परीक्षा' : 'My Examination'}
        </div>
        
        {/* Gold Lotus Divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', marginBottom: '1.25rem', gap: '8px' }}>
          <div style={{ width: '20px', height: '1px', background: '#c59f2d' }}></div>
          <svg viewBox="0 0 100 100" style={{ width: '22px', height: '22px', fill: '#d4af37' }}>
            <path d="M50 20 C40 35, 45 65, 50 80 C55 65, 60 35, 50 20 Z" />
            <path d="M50 35 C30 45, 25 70, 42 80 C40 70, 42 55, 50 35 Z" />
            <path d="M50 35 C70 45, 75 70, 58 80 C60 70, 58 55, 50 35 Z" />
            <path d="M50 50 C20 55, 12 75, 34 82 C30 75, 36 65, 50 50 Z" />
            <path d="M50 50 C80 55, 88 75, 66 82 C70 75, 64 65, 50 50 Z" />
          </svg>
          <div style={{ width: '80px', height: '1px', background: 'linear-gradient(to right, #c59f2d, transparent)' }}></div>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem', width: '100%' }}>{error}</div>}

        {exams.length === 0 ? (
          <div className="mobile-dashboard-card" style={{ textAlign: 'center', padding: '2rem 1rem', color: '#a0aec0' }}>
            {t.noExams}
          </div>
        ) : (
          exams.map((ex) => (
            <div key={ex.id} className="mobile-dashboard-card">

              {/* Exam Name */}
              <h3 className="mobile-exam-name">{ex.name}</h3>

              <div className="mobile-exam-divider"></div>

              {/* Exam Metadata Row */}
              <div className="mobile-exam-metadata">
                <div className="meta-col">
                  <div className="meta-icon">
                    <Calendar size={20} />
                  </div>
                  <div className="meta-labels">
                    <span className="label">{lang === 'hi' ? 'परीक्षा तिथि' : 'Exam Date'}</span>
                    <span className="val">{new Date(ex.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="meta-divider"></div>

                <div className="meta-col">
                  <div className="meta-icon">
                    <Clock size={20} />
                  </div>
                  <div className="meta-labels">
                    <span className="label">{lang === 'hi' ? 'अवधि' : 'Duration'}</span>
                    <span className="val">{ex.duration} {lang === 'hi' ? 'मिनट' : 'Min'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {ex.attemptStatus === 'COMPLETED' ? (
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                  <div className="badge badge-success" style={{ flexGrow: 1, display: 'inline-flex', alignContent: 'center', justifyContent: 'center', height: '48px', alignItems: 'center', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold' }}>
                    {t.completed}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/student/exams/attempt/${ex.attemptId}/certificate`, {
                          headers: { Authorization: `Bearer ${token}` }
                        })
                        const data = await res.json()
                        if (data.success) {
                          setCompletedAttempt(data.certificate)
                        }
                      } catch (err) {
                        console.error(err)
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0 16px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Certificate Details"
                  >
                    <Award size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartExam(ex.id)}
                  disabled={startingExamId !== null}
                  className="take-exam-dark-btn"
                >
                  {startingExamId === ex.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}>
                      <span className="spinner-small" style={{ borderColor: '#ffffff', borderTopColor: 'transparent' }}></span>
                      <span>{lang === 'hi' ? 'शुरू हो रहा है...' : 'Loading...'}</span>
                    </div>
                  ) : (
                    <>
                      <FileEdit size={20} style={{ color: '#f5d782' }} />
                      <span style={{ flexGrow: 1, textAlign: 'center' }}>{lang === 'hi' ? 'परीक्षा शुरू करें' : 'TAKE EXAM'}</span>
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header-banner" style={{ padding: '2rem', borderRadius: '4px', backgroundColor: '#ffffff', border: '1px solid var(--border-muted)', marginBottom: '2rem' }}>
        <h1 className="header-banner-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--primary-navy)', marginBottom: '0.75rem', textAlign: 'left' }}>
          {t.welcomeUser.replace('{name}', user.name || 'Student')}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          <span className="badge badge-outline" style={{ fontSize: '0.85rem', textTransform: 'none', padding: '0.4rem 0.8rem' }}>
            {t.classBadge}: <strong>{user.classroom?.name}</strong>
          </span>
          <span className="badge badge-outline" style={{ fontSize: '0.85rem', textTransform: 'none', padding: '0.4rem 0.8rem' }}>
            {t.schoolBadge}: <strong>{user.school?.name}</strong>
          </span>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ maxWidth: '600px' }}>{error}</div>}

      <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>{t.pushedExams}</h3>

      {exams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          {t.noExams}
        </div>
      ) : (
        <div className="grid-3">
          {exams.map((ex) => (
            <div key={ex.id} className="card flex-between" style={{ flexDirection: 'column', alignItems: 'flex-start', minHeight: '230px' }}>
              <div style={{ width: '100%' }}>
                <span className="badge badge-outline" style={{ marginBottom: '0.75rem' }}>
                  {ex.categoryName}{ex.subcategoryName ? ` > ${ex.subcategoryName}` : ''}
                </span>
                <h4 className="card-title" style={{ border: 'none', padding: 0 }}>{ex.name}</h4>
                <div className="card-metadata">
                  <span><Clock size={14} /> {ex.duration} {t.mins}</span>
                  <span><TrophyIcon size={14} /> {t.maxMarks}: {ex.totalMarks}</span>
                </div>
              </div>

              <div style={{ width: '100%', marginTop: '1rem' }}>
                {ex.attemptStatus === 'COMPLETED' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="badge badge-success" style={{ flexGrow: 1, display: 'inline-flex', alignContent: 'center', justifyContent: 'center', height: '40px', alignItems: 'center' }}>
                      {t.completed}
                    </div>
                    <button
                      onClick={async () => {
                        // Fetch certificate details dynamically
                        try {
                          const res = await fetch(`/api/student/exams/attempt/${ex.attemptId}/certificate`, {
                            headers: { Authorization: `Bearer ${token}` }
                          })
                          const data = await res.json()
                          if (data.success) {
                            setCompletedAttempt(data.certificate)
                          }
                        } catch (err) {
                          console.error(err)
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', height: '40px' }}
                      title="Certificate Details"
                    >
                      <Award size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartExam(ex.id)}
                    disabled={startingExamId !== null}
                    className="btn btn-primary w-full"
                    style={{
                      width: '100%',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {startingExamId === ex.id ? (
                      <>
                        <span className="spinner-small"></span>
                        <span>{lang === 'hi' ? 'शुरू हो रहा है...' : 'Loading Exam...'}</span>
                      </>
                    ) : (
                      <>
                        {ex.attemptStatus === 'IN_PROGRESS' ? t.inProgress : t.notStarted} <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ==========================================
   VIEW: STUDENT ACTIVE EXAM SESSION
   ========================================== */
export function ExamSessionView({
  session,
  exams,
  onSubmit,
  lang,
  onChangeLang,
}: {
  session: any
  exams: any[]
  onSubmit: (attemptId: string, responses: any) => Promise<void>
  lang: Language
  onChangeLang: (lang: Language) => void
}) {
  const { token } = useAuth()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const [responses, setResponses] = useState<any>(() => {
    let localResp = {}
    try {
      const local = localStorage.getItem(`exam_responses_${session.attemptId}`)
      if (local) {
        localResp = JSON.parse(local)
      }
    } catch (e) {
      console.error(e)
    }
    return { ...(session.responses || {}), ...localResp }
  })
  const [visited, setVisited] = useState<Record<number, boolean>>(() => {
    try {
      const local = localStorage.getItem(`exam_visited_${session.attemptId}`)
      if (local) {
        return JSON.parse(local)
      }
    } catch (e) {
      console.error(e)
    }
    return { 0: true }
  })
  const [timeLeft, setTimeLeft] = useState(0) // Remaining seconds
  const [submitting, setSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  const timerRef = useRef<any | null>(null)

  const currentExam = exams.find((e: any) => e.id === session.examId)
  const examName = currentExam ? currentExam.name : session.examName

  // Mark current index as visited
  useEffect(() => {
    setVisited((prev) => {
      if (prev[currentIdx]) return prev
      const updated = { ...prev, [currentIdx]: true }
      try {
        localStorage.setItem(`exam_visited_${session.attemptId}`, JSON.stringify(updated))
      } catch (e) {
        console.error(e)
      }
      return updated
    })
  }, [currentIdx, session.attemptId])

  // Center scroll the current index indicator box
  useEffect(() => {
    const activeEl = document.getElementById(`indicator-box-${currentIdx}`)
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }, [currentIdx])

  // Calculate remaining seconds based on duration and start date
  useEffect(() => {
    const examDurationSec = session.duration * 60
    const startMs = new Date(session.startedAt).getTime()
    
    const tick = () => {
      const elapsedMs = Date.now() - startMs
      const remainingSec = Math.max(0, examDurationSec - Math.floor(elapsedMs / 1000))
      setTimeLeft(remainingSec)

      if (remainingSec <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        handleAutoSubmit()
      }
    }

    tick()
    timerRef.current = setInterval(tick, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [session])

  const saveProgressToDb = async (currentResponses: any) => {
    try {
      const res = await fetch('/api/student/exams/attempt/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attemptId: session.attemptId,
          responses: currentResponses,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        console.error('Failed to save progress to DB:', data.error)
      }
    } catch (err) {
      console.error('Error saving progress to DB:', err)
    }
  }

  const handleSelectOption = (questionId: string, option: string) => {
    const updated = { ...responses, [questionId]: option }
    setResponses(updated)

    try {
      localStorage.setItem(`exam_responses_${session.attemptId}`, JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    const answeredCount = Object.keys(updated).length
    if (answeredCount > 0 && answeredCount % 10 === 0) {
      saveProgressToDb(updated)
    }
  }

  const handleAutoSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    await onSubmit(session.attemptId, responses)
  }

  const handleManualSubmit = () => {
    setShowPreview(true)
  }

  const handleFinalSubmit = () => {
    setShowSubmitConfirm(true)
  }

  const renderSubmitConfirmModal = () => {
    if (!showSubmitConfirm) return null
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(11, 26, 48, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div className="card" style={{
          backgroundColor: '#16253b',
          border: '2px solid var(--accent-gold, #c5a059)',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          textAlign: 'center',
          color: '#ffffff',
          animation: 'modalScaleIn 0.25s ease-out'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-serif, serif)',
            fontSize: '1.4rem',
            color: 'var(--accent-gold, #c5a059)',
            marginBottom: '15px',
            borderBottom: '1px solid rgba(197, 160, 89, 0.2)',
            paddingBottom: '10px'
          }}>
            {lang === 'hi' ? 'परीक्षा जमा करने की पुष्टि करें' : 'Confirm Exam Submission'}
          </h3>
          
          <p style={{
            fontSize: '0.95rem',
            lineHeight: '1.6',
            marginBottom: '20px',
            color: '#e2e8f0',
            textAlign: 'left'
          }}>
            {lang === 'hi'
              ? 'क्या आप वाकई अपनी परीक्षा जमा करना चाहते हैं? एक बार जमा करने के बाद आप अपने उत्तरों को बदल नहीं सकते।'
              : 'Are you sure you want to submit your examination? Once submitted, you cannot change your answers.'}
          </p>

          {(session.questions.length - Object.keys(responses).length) > 0 && (
            <div style={{
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid #ff9800',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem', color: '#ff9800', lineHeight: 1 }}>⚠</span>
              <div style={{ fontSize: '0.85rem', color: '#ffcc80', lineHeight: '1.4' }}>
                {lang === 'hi'
                  ? `आपके पास ${session.questions.length - Object.keys(responses).length} प्रश्न अनुत्तरित हैं।`
                  : `You have ${session.questions.length - Object.keys(responses).length} question(s) left unanswered.`}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowSubmitConfirm(false)}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {lang === 'hi' ? 'परीक्षा पर वापस जाएं' : 'Back to Exam'}
            </button>
            
            <button
              onClick={async () => {
                setShowSubmitConfirm(false)
                setSubmitting(true)
                await onSubmit(session.attemptId, responses)
              }}
              disabled={submitting}
              className="btn btn-primary"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: 'var(--success-color, #4caf50)',
                borderColor: 'var(--success-color, #4caf50)',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {submitting
                ? (lang === 'hi' ? 'जमा किया जा रहा है...' : 'Submitting...')
                : (lang === 'hi' ? 'जमा करें' : 'Submit')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentQ = session.questions[currentIdx]
  const activeTrans = currentQ?.translations?.find((tr: any) => tr.language === lang) || currentQ
  const t = translations[lang]

  const pTrans = {
    title: lang === 'hi' ? 'परीक्षा सारांश और पूर्वावलोकन' : 'Exam Summary & Preview',
    desc: lang === 'hi' ? 'अंतिम रूप से जमा करने से पहले कृपया अपने उत्तरों की समीक्षा करें।' : 'Please review your answers before final submission.',
    total: lang === 'hi' ? 'कुल प्रश्न' : 'Total Questions',
    answered: lang === 'hi' ? 'उत्तर दिया गया' : 'Answered',
    unanswered: lang === 'hi' ? 'अनुत्तरित' : 'Unanswered',
    status: lang === 'hi' ? 'स्थिति' : 'Status',
    notAnswered: lang === 'hi' ? 'उत्तर नहीं दिया गया' : 'Not Answered',
    jump: lang === 'hi' ? 'प्रश्न पर जाएं' : 'Jump to Question',
    back: lang === 'hi' ? 'परीक्षा पर वापस जाएं' : 'Back to Exam',
    submit: lang === 'hi' ? 'पुष्टि करें और जमा करें' : 'Confirm & Submit',
    submitting: lang === 'hi' ? 'जमा किया जा रहा है...' : 'Submitting...',
    optionLabel: lang === 'hi' ? 'विकल्प' : 'Option'
  }

  if (showPreview) {
    const answeredCount = Object.keys(responses).length
    const unansweredCount = session.questions.length - answeredCount

    return (
      <div className="new-exam-layout">
        <div className="new-exam-top-bar">
          <div className="new-exam-name">{examName} - {pTrans.title}</div>
          <div className="new-exam-top-actions">
            <LanguageSelector lang={lang} onChangeLang={onChangeLang} isDark={false} />
          </div>
        </div>



        <div className="container exam-content" style={{ maxWidth: '600px', marginTop: '1rem', padding: '0 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #f2e2cc', borderRadius: '10px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>{pTrans.total}</span>
              <h2 style={{ fontSize: '1.5rem', margin: '0.25rem 0 0', color: '#0f3d7a', fontWeight: 700 }}>{session.questions.length}</h2>
            </div>
            <div style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #f2e2cc', borderLeft: '4px solid #48bb78', borderRadius: '10px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>{pTrans.answered}</span>
              <h2 style={{ fontSize: '1.5rem', margin: '0.25rem 0 0', color: '#48bb78', fontWeight: 700 }}>{answeredCount}</h2>
            </div>
            <div style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #f2e2cc', borderLeft: '4px solid #ff9800', borderRadius: '10px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>{pTrans.unanswered}</span>
              <h2 style={{ fontSize: '1.5rem', margin: '0.25rem 0 0', color: '#ff9800', fontWeight: 700 }}>{unansweredCount}</h2>
            </div>
          </div>

          <div style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '12px', border: '1px solid #f2e2cc', backgroundColor: '#ffffff' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.1rem', color: '#0f3d7a', marginBottom: '1rem', borderBottom: '1px solid #f2e2cc', paddingBottom: '0.5rem', textAlign: 'left' }}>
              {lang === 'hi' ? 'सभी प्रश्नों की समीक्षा करें' : 'Review All Questions'}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {session.questions.map((q: any, idx: number) => {
                const answer = responses[q.id]
                const isAnswered = !!answer
                const qTrans = q.translations?.find((tr: any) => tr.language === lang) || q
                const plainText = qTrans.text ? qTrans.text.replace(/<[^>]*>/g, '') : ''
                const snippet = plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText

                return (
                  <div 
                    key={q.id} 
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      backgroundColor: '#fffdfb', 
                      border: '1px solid #f2e2cc', 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.15rem', color: '#0f3d7a' }}>
                        {t.questionOf.split(' ')[0]} {idx + 1}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#2d3748', lineHeight: '1.4', fontWeight: 500 }}>
                        {snippet}
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      borderTop: '1px solid #f2e2cc',
                      paddingTop: '0.4rem'
                    }}>
                      <span className={`badge ${isAnswered ? 'badge-success' : 'badge-outline'}`} style={{ minWidth: '80px', textAlign: 'center', textTransform: 'none', fontSize: '0.75rem' }}>
                        {isAnswered ? `${pTrans.optionLabel} ${answer}` : pTrans.notAnswered}
                      </span>

                      <button
                        onClick={() => {
                          setCurrentIdx(idx)
                          setShowPreview(false)
                        }}
                        style={{
                          background: '#fffdf5',
                          border: '1px solid #c5a059',
                          borderRadius: '6px',
                          color: '#0b1a30',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {pTrans.jump}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowPreview(false)}
              className="new-nav-btn prev"
              style={{ flex: 1 }}
            >
              {pTrans.back}
            </button>

            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="new-nav-btn submit-final"
              style={{ flex: 1 }}
            >
              {submitting ? pTrans.submitting : pTrans.submit}
            </button>
          </div>
        </div>
        {renderSubmitConfirmModal()}
      </div>
    )
  }

  if (isDesktop && !showPreview) {
    return (
      <div 
        className="new-exam-layout"
        style={{
          minHeight: '100vh',
          width: '100%',
          padding: '2rem 4rem 3rem 4rem',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative'
        }}
      >
        {/* Floating Language Selector */}
        <div style={{ position: 'absolute', top: '24px', right: '40px', zIndex: 1000 }}>
          <LanguageSelector lang={lang} onChangeLang={onChangeLang} isDark={false} />
        </div>

        {/* Floating Exam Name at the Top Mid */}
        <div style={{ 
          position: 'absolute', 
          top: '135px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-serif, serif)',
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#8c6239',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          padding: '4px 20px',
          borderRadius: '20px',
          border: '1px solid rgba(197, 160, 89, 0.15)',
          backdropFilter: 'blur(4px)',
          whiteSpace: 'nowrap'
        }}>
          {examName}
        </div>

        {/* Spacer to push content down past the background logo/header graphic */}
        <div style={{ height: '200px' }}></div>

        {/* Stats Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid rgba(197, 160, 89, 0.25)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          padding: '16px 32px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
        }}>
          {/* Duration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fffdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #c5a059'
            }}>
              <Clock size={24} style={{ color: '#8c6239' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', color: '#8c6239', fontWeight: 600 }}>
                {lang === 'hi' ? 'समय शेष' : 'Duration'}
              </span>
              <span style={{ fontSize: '1.6rem', color: '#0b2240', fontWeight: 800, fontFamily: 'var(--font-sans, sans-serif)' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div style={{ width: '1px', height: '40px', backgroundColor: '#e2d5c5' }}></div>

          {/* Total Questions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fffdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #c5a059'
            }}>
              <FileText size={24} style={{ color: '#8c6239' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', color: '#8c6239', fontWeight: 600 }}>
                {lang === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}
              </span>
              <span style={{ fontSize: '1.6rem', color: '#0b2240', fontWeight: 800, fontFamily: 'var(--font-sans, sans-serif)' }}>
                {session.questions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area: Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.7fr 1fr',
          gap: '24px',
          alignItems: 'stretch'
        }}>
          {/* Left Panel: Question details */}
          {currentQ && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid rgba(197, 160, 89, 0.25)',
              borderRadius: '16px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
              boxSizing: 'border-box'
            }}>
              <div style={{ fontSize: '1rem', color: '#718096', fontWeight: 600, marginBottom: '8px' }}>
                {lang === 'hi' ? `प्रश्न ${currentIdx + 1} का ${session.questions.length}` : `Question ${currentIdx + 1} of ${session.questions.length}`}
              </div>

              <h3 style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#0b2240',
                lineHeight: 1.5,
                marginTop: 0,
                marginBottom: '24px'
              }}>
                {activeTrans?.text || currentQ?.text}
              </h3>

              {/* Stack / Side-by-side depending on image */}
              <div style={{
                display: currentQ.referenceImage ? 'grid' : 'flex',
                gridTemplateColumns: currentQ.referenceImage ? '1fr 1fr' : 'none',
                flexDirection: 'column',
                gap: '24px',
                width: '100%'
              }}>
                {/* Reference Image */}
                {currentQ.referenceImage && (
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f7fafc',
                    height: '280px'
                  }}>
                    <img 
                      src={currentQ.referenceImage.trim()} 
                      alt="Question Reference" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                )}

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const optText = activeTrans ? activeTrans[`option${opt}`] : currentQ[`option${opt}`]
                    const isSelected = responses[currentQ.id] === opt

                    return (
                      <div
                        key={opt}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 20px',
                          border: isSelected ? '1px solid #e2a13b' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#fffdf5' : '#ffffff',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: isSelected ? 'none' : '1.5px solid #c5a059',
                            backgroundColor: isSelected ? '#e2a13b' : 'transparent',
                            color: isSelected ? '#ffffff' : '#8c6239',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.05rem',
                            fontWeight: 700
                          }}>
                            {opt}
                          </div>
                          <span style={{ fontSize: '1.05rem', color: '#0b2240', fontWeight: 500 }}>
                            {renderContent(optText)}
                          </span>
                        </div>

                        {isSelected && (
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: '#e2a13b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff'
                          }}>
                            <Check size={12} strokeWidth={3.5} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Right Panel: Navigator */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid rgba(197, 160, 89, 0.25)',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0b2240',
              textAlign: 'center',
              marginTop: 0,
              marginBottom: '24px'
            }}>
              {lang === 'hi' ? 'प्रश्न नेविगेशन' : 'Question Navigation'}
            </h3>

            {/* Grid of buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '8px',
              maxHeight: '340px',
              overflowY: 'auto',
              paddingRight: '4px',
              marginBottom: '24px'
            }}>
              {session.questions.map((q: any, idx: number) => {
                const isAnswered = !!responses[q.id]
                const isCurrent = idx === currentIdx

                let bgColor = '#edf2f7'
                let borderStyle = 'none'
                let textColor = '#a0aec0'

                if (isAnswered) {
                  bgColor = '#48bb78'
                  textColor = '#ffffff'
                } else if (isCurrent) {
                  bgColor = '#e2a13b'
                  textColor = '#ffffff'
                } else if (!visited[idx]) {
                  bgColor = '#edf2f7'
                  textColor = '#a0aec0'
                } else {
                  bgColor = '#ffffff'
                  borderStyle = '1px solid #cbd5e0'
                  textColor = '#4a5568'
                }

                return (
                  <div
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      height: '36px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: bgColor,
                      border: borderStyle,
                      color: textColor,
                      transition: 'all 0.15s ease',
                      boxSizing: 'border-box'
                    }}
                  >
                    {idx + 1}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{
              marginTop: 'auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 16px',
              borderTop: '1px solid #edf2f7',
              paddingTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#48bb78' }}></span>
                <span style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 600 }}>
                  {lang === 'hi' ? 'उत्तर दिया' : 'Answered'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#e2a13b' }}></span>
                <span style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 600 }}>
                  {lang === 'hi' ? 'वर्तमान' : 'Current'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#ffffff' }}></span>
                <span style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 600 }}>
                  {lang === 'hi' ? 'अनुत्तरित' : 'Unanswered'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#edf2f7' }}></span>
                <span style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 600 }}>
                  {lang === 'hi' ? 'देखा नहीं गया' : 'Not Visited'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Nav Bar */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid rgba(197, 160, 89, 0.25)',
          borderRadius: '16px',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
          boxSizing: 'border-box'
        }}>
          {/* Previous Button */}
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #0b2240',
              color: '#0b2240',
              borderRadius: '8px',
              height: '48px',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIdx === 0 ? 0.5 : 1,
              outline: 'none'
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>{lang === 'hi' ? 'पिछला' : 'PREVIOUS'}</span>
          </button>

          {/* Lotus Motif */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '40px', height: '1px', background: '#c59f2d' }}></div>
            <svg viewBox="0 0 100 100" style={{ width: '22px', height: '22px', fill: '#d4af37' }}>
              <path d="M50 20 C40 35, 45 65, 50 80 C55 65, 60 35, 50 20 Z" />
              <path d="M50 35 C30 45, 25 70, 42 80 C40 70, 42 55, 50 35 Z" />
              <path d="M50 35 C70 45, 75 70, 58 80 C60 70, 58 55, 50 35 Z" />
              <path d="M50 50 C20 55, 12 75, 34 82 C30 75, 36 65, 50 50 Z" />
              <path d="M50 50 C80 55, 88 75, 66 82 C70 75, 64 65, 50 50 Z" />
            </svg>
            <div style={{ width: '40px', height: '1px', background: 'linear-gradient(to right, #c59f2d, transparent)' }}></div>
          </div>

          {/* Next / Finish Button */}
          {currentIdx === session.questions.length - 1 ? (
            <button
              onClick={handleManualSubmit}
              disabled={submitting}
              style={{
                backgroundColor: '#0b2240',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                height: '48px',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <span>{lang === 'hi' ? 'समाप्त' : 'FINISH'}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(session.questions.length - 1, prev + 1))}
              style={{
                backgroundColor: '#0b2240',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                height: '48px',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <span>{lang === 'hi' ? 'अगला' : 'NEXT'}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          )}
        </div>
        {renderSubmitConfirmModal()}
      </div>
    )
  }

  return (
    <div className="new-exam-layout">
      {/* Sticky top-bar with Language Selector and Exam Name */}
      <div className="new-exam-top-bar">
        <div className="new-exam-name" title={examName}>{examName}</div>
        <div className="new-exam-top-actions">
          <LanguageSelector lang={lang} onChangeLang={onChangeLang} isDark={false} />
        </div>
      </div>



      {/* Timer & Question Count Stats Card */}
      <div className="new-exam-stats-card">
        <div className="stats-col">
          <div className="stats-icon-wrapper">
            <Clock size={22} style={{ color: '#c5a059' }} />
          </div>
          <div className="stats-labels">
            <span className="label">{lang === 'hi' ? 'समय शेष' : 'Duration'}</span>
            <span className="val">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="stats-divider"></div>
        <div className="stats-col">
          <div className="stats-icon-wrapper">
            <FileText size={22} style={{ color: '#c5a059' }} />
          </div>
          <div className="stats-labels">
            <span className="label">{lang === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}</span>
            <span className="val">{session.questions.length}</span>
          </div>
        </div>
      </div>

      {/* Question Details Card */}
      {currentQ && (
        <div className="new-question-card-wrapper">
          <div className="question-info-header">
            {lang === 'hi' ? `प्रश्न ${currentIdx + 1} का ${session.questions.length}` : `Question ${currentIdx + 1} of ${session.questions.length}`}
          </div>
          
          <div className="new-question-text">
            {activeTrans?.text || currentQ?.text}
          </div>

          {currentQ.referenceImage && (
            <div className="new-question-image-wrapper">
              <img src={currentQ.referenceImage.trim()} alt="Question Reference" className="new-question-img" />
            </div>
          )}

          {/* Options List */}
          <div className="new-options-list">
            {['A', 'B', 'C', 'D'].map((opt) => {
              const optText = activeTrans ? activeTrans[`option${opt}`] : currentQ[`option${opt}`]
              const isSelected = responses[currentQ.id] === opt

              return (
                <div
                  key={opt}
                  className={`new-option-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                >
                  <div className="option-left-content">
                    <div className={`option-badge ${isSelected ? 'selected' : ''}`}>
                      {opt}
                    </div>
                    <div className="option-text-val">
                      {renderContent(optText)}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="option-check-icon">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Horizontally scrollable Question Navigator */}
      <div className="new-navigator-card">
        <div className="navigator-grid-scroll">
          {session.questions.map((q: any, idx: number) => {
            const isAnswered = !!responses[q.id]
            const isCurrent = idx === currentIdx
            
            let dotClass = 'new-indicator-box'
            if (isAnswered) {
              dotClass += ' answered'
            } else if (isCurrent) {
              dotClass += ' current'
            } else if (!visited[idx]) {
              dotClass += ' not-visited'
            } else {
              dotClass += ' unanswered'
            }

            return (
              <div 
                key={q.id} 
                id={`indicator-box-${idx}`}
                className={dotClass} 
                onClick={() => setCurrentIdx(idx)}
              >
                {idx + 1}
              </div>
            )
          })}
        </div>

        {/* Navigator Legend */}
        <div className="navigator-legend">
          <div className="legend-item">
            <span className="legend-color answered"></span>
            <span className="legend-text">{lang === 'hi' ? 'उत्तर दिया गया' : 'Answered'}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color current"></span>
            <span className="legend-text">{lang === 'hi' ? 'वर्तमान' : 'Current'}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color unanswered"></span>
            <span className="legend-text">{lang === 'hi' ? 'उत्तर नहीं दिया' : 'Unanswered'}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color not-visited"></span>
            <span className="legend-text">{lang === 'hi' ? 'देखा नहीं गया' : 'Not Visited'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar (Previous, Motifs, Next/Finish) */}
      <div className="new-bottom-nav-container">
        <button 
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="new-nav-btn prev"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>{lang === 'hi' ? 'पिछला' : 'PREVIOUS'}</span>
        </button>

        <div className="new-lotus-motif">
          <div style={{ width: '12px', height: '1px', background: '#c59f2d' }}></div>
          <svg viewBox="0 0 100 100" style={{ width: '18px', height: '18px', fill: '#d4af37' }}>
            <path d="M50 20 C40 35, 45 65, 50 80 C55 65, 60 35, 50 20 Z" />
            <path d="M50 35 C30 45, 25 70, 42 80 C40 70, 42 55, 50 35 Z" />
            <path d="M50 35 C70 45, 75 70, 58 80 C60 70, 58 55, 50 35 Z" />
          </svg>
          <div style={{ width: '12px', height: '1px', background: '#c59f2d' }}></div>
        </div>

        {currentIdx === session.questions.length - 1 ? (
          <button 
            onClick={handleManualSubmit} 
            className="new-nav-btn submit-final"
            disabled={submitting}
          >
            <span>{lang === 'hi' ? 'समाप्त' : 'FINISH'}</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        ) : (
          <button 
            onClick={() => setCurrentIdx((prev) => Math.min(session.questions.length - 1, prev + 1))}
            className="new-nav-btn next"
          >
            <span>{lang === 'hi' ? 'अगला' : 'NEXT'}</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        )}
      </div>

      {renderSubmitConfirmModal()}
    </div>
  )
}
