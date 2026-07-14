import React, { useState, useEffect, useRef } from 'react'
import { translations, Language } from '../utils/localization'
import { useAuth, User } from '../context/AuthContext'
import { generateCertificatePDF } from '../utils/pdfGenerator'
import { renderContent } from '../utils/contentRenderer'
import { 
  Award, Clock, Award as TrophyIcon, CheckCircle, ChevronLeft, ChevronRight 
} from 'lucide-react'

/* ==========================================
   VIEW: STUDENT DASHBOARD
   ========================================== */
export function StudentDashboard({ token, user, lang }: { token: string | null; user: User; lang: Language }) {
  const [exams, setExams] = useState<any[]>([])
  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [completedAttempt, setCompletedAttempt] = useState<any | null>(null)
  const [error, setError] = useState('')

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
        onSubmit={handleFinishExamSubmit}
        lang={lang}
      />
    )
  }

  if (completedAttempt) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '4rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2.5rem' }}>
          <CheckCircle size={64} style={{ color: 'var(--success-color)', marginBottom: '1.5rem' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1rem' }}>
            {t.congratulations}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            {t.successSubmitDesc}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => handleCertificateDownload()}
              className="btn btn-primary w-full"
            >
              <Award size={18} /> {t.downloadCertificate}
            </button>
            <button
              onClick={() => setCompletedAttempt(null)}
              className="btn btn-secondary w-full"
            >
              {t.backToDashboard}
            </button>
          </div>
        </div>
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
                    className="btn btn-primary w-full"
                    style={{ width: '100%', height: '40px' }}
                  >
                    {ex.attemptStatus === 'IN_PROGRESS' ? t.inProgress : t.notStarted} <ChevronRight size={16} />
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
  onSubmit,
  lang,
}: {
  session: any
  onSubmit: (attemptId: string, responses: any) => Promise<void>
  lang: Language
}) {
  const { token } = useAuth()
  const [currentIdx, setCurrentIdx] = useState(0)
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
  const [timeLeft, setTimeLeft] = useState(0) // Remaining seconds
  const [submitting, setSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  const timerRef = useRef<any | null>(null)

  // Calculate remaining seconds based on duration and start date
  useEffect(() => {
    const examDurationSec = session.duration * 60
    const startMs = new Date(session.startedAt).getTime()
    
    const tick = () => {
      const elapsedMs = Date.now() - startMs
      const remainingSec = Math.max(0, examDurationSec - Math.floor(elapsedMs / 1000))
      setTimeLeft(remainingSec)

      if (remainingSec <= 0) {
        // Time expired! Trigger auto submit
        if (timerRef.current) clearInterval(timerRef.current)
        handleAutoSubmit()
      }
    }

    tick() // initial call
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

    // Save to local storage on every question answered
    try {
      localStorage.setItem(`exam_responses_${session.attemptId}`, JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    // Save to database after every 10th question
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
      <div className="exam-layout">
        <header className="exam-header">
          <div className="navbar-container">
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--primary-navy)' }}>
                {session.examName} - {pTrans.title}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {pTrans.desc}
              </span>
            </div>
            <div className="exam-timer">
              <Clock size={16} /> {t.timer}: {formatTime(timeLeft)}
            </div>
          </div>
        </header>

        <div className="container exam-content" style={{ maxWidth: '800px', marginTop: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1rem', textAlign: 'center', border: '1px solid var(--border-muted)', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pTrans.total}</span>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 0', color: 'var(--primary-navy)' }}>{session.questions.length}</h2>
            </div>
            <div className="card" style={{ padding: '1rem', textAlign: 'center', border: '1px solid var(--border-muted)', borderLeft: '4px solid var(--success-color)', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pTrans.answered}</span>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 0', color: 'var(--success-color)' }}>{answeredCount}</h2>
            </div>
            <div className="card" style={{ padding: '1rem', textAlign: 'center', border: '1px solid var(--border-muted)', borderLeft: '4px solid #ff9800', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pTrans.unanswered}</span>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 0', color: '#ff9800' }}>{unansweredCount}</h2>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '6px' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.75rem', textAlign: 'left' }}>
              {lang === 'hi' ? 'सभी प्रश्नों की समीक्षा करें' : 'Review All Questions'}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {session.questions.map((q: any, idx: number) => {
                const answer = responses[q.id]
                const isAnswered = !!answer
                const qTrans = q.translations?.find((tr: any) => tr.language === lang) || q
                const plainText = qTrans.text ? qTrans.text.replace(/<[^>]*>/g, '') : ''
                const snippet = plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText

                return (
                  <div key={q.id} className="flex-between" style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'var(--bg-muted, #f8f9fa)', border: '1px solid var(--border-muted)', gap: '1rem' }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--primary-navy)' }}>
                        {t.questionOf.split(' ')[0]} {idx + 1}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-color)' }}>
                        {snippet}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`badge ${isAnswered ? 'badge-success' : 'badge-outline'}`} style={{ minWidth: '100px', textAlign: 'center', textTransform: 'none' }}>
                        {isAnswered ? `${pTrans.optionLabel} ${answer}` : pTrans.notAnswered}
                      </span>

                      <button
                        onClick={() => {
                          setCurrentIdx(idx)
                          setShowPreview(false)
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        {pTrans.jump}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex-between" style={{ gap: '1rem' }}>
            <button
              onClick={() => setShowPreview(false)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              {pTrans.back}
            </button>

            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="btn btn-primary"
              style={{ flex: 1, backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
            >
              {submitting ? pTrans.submitting : pTrans.submit}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="exam-layout">
      {/* Exam Header Banner */}
      <header className="exam-header">
        <div className="navbar-container">
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--primary-navy)' }}>
              {session.examName}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t.questionOf.replace('{current}', String(currentIdx + 1)).replace('{total}', String(session.questions.length))}
            </span>
          </div>

          <div className="exam-timer">
            <Clock size={16} /> {t.timer}: {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* Main question cards */}
      <div className="container exam-content" style={{ maxWidth: '750px' }}>
        {currentQ && (
          <div className="question-card">
            <div className="question-number">{t.questionOf.split(' ')[0]} {currentIdx + 1}</div>
            <div className="question-text" style={{ textAlign: 'left' }}>
              <div>{activeTrans?.text || currentQ?.text}</div>
              {currentQ.referenceImage && (
                <img 
                  src={currentQ.referenceImage.trim()} 
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block', borderRadius: '4px', marginTop: '1rem', marginBottom: '1rem' }} 
                  alt="Question Reference" 
                />
              )}
            </div>

            <div className="options-list">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optText = activeTrans ? activeTrans[`option${opt}`] : currentQ[`option${opt}`]
                const isSelected = responses[currentQ.id] === opt

                return (
                  <div
                    key={opt}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQ.id}`}
                      className="option-radio"
                      checked={isSelected}
                      readOnly
                    />
                    <span className="option-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', width: '100%', textAlign: 'left' }}>
                      <strong>{opt}.</strong> {renderContent(optText)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation panel */}
        <div className="navigation-panel flex-between">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            className="btn btn-secondary"
            disabled={currentIdx === 0}
          >
            <ChevronLeft size={16} /> {t.previous}
          </button>

          {currentIdx === session.questions.length - 1 ? (
            <button onClick={handleManualSubmit} className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }} disabled={submitting}>
              {submitting ? t.submitting : t.submitExam}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(session.questions.length - 1, prev + 1))}
              className="btn btn-primary"
            >
              {t.next} <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Indicators Dots grid */}
        <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
          <span className="form-label" style={{ marginBottom: '0.75rem' }}>{t.questionNavigator}</span>
          <div className="question-indicator-grid">
            {session.questions.map((q: any, idx: number) => {
              const isAnswered = !!responses[q.id]
              const isCurrent = idx === currentIdx
              
              let dotClass = 'indicator-dot'
              if (isAnswered) dotClass += ' answered'
              if (isCurrent) dotClass += ' current'

              return (
                <div key={q.id} className={dotClass} onClick={() => setCurrentIdx(idx)}>
                  {idx + 1}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showSubmitConfirm && (
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
      )}
    </div>
  )
}
