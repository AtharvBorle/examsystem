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
  }, [token, lang])

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

  const handleManualSubmit = async () => {
    const unanswered = session.questions.length - Object.keys(responses).length
    let confirmMsg = t.confirmSubmit
    if (unanswered > 0) {
      confirmMsg += t.confirmUnanswered.replace('{count}', String(unanswered))
    }

    if (window.confirm(confirmMsg)) {
      setSubmitting(true)
      await onSubmit(session.attemptId, responses)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentQ = session.questions[currentIdx]
  const activeTrans = currentQ?.translations?.find((tr: any) => tr.language === lang) || currentQ
  const t = translations[lang]

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
    </div>
  )
}
