import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import defaultIconAsset from '../assets/app_icon.jpeg'
import bvpBkjIconAsset from '../assets/BVP-BKJ_icon.jpeg'
import { useAppIcon } from '../context/AppIconContext'
import { translations, Language } from '../utils/localization'
import { generateSchoolReportPDF } from '../utils/pdfGenerator'
import { downloadCSV } from './AdminViews'
import { 
  ShieldCheck, RotateCw, School as SchoolIcon, Award, Download, 
  FileText, LogOut, CheckCircle, Clock, ChevronRight, AlertCircle, Eye, EyeOff
} from 'lucide-react'

export function SchoolPortalView({ 
  initialUdise, 
  lang, 
  onChangeLang,
  onExit
}: { 
  initialUdise?: string | null
  lang: Language
  onChangeLang: (l: Language) => void
  onExit: () => void
}) {
  const t = translations[lang || 'en']
  const { appIconSrc } = useAppIcon()

  const [udise, setUdise] = useState(initialUdise || '')
  const [captchaQuestion, setCaptchaQuestion] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schoolData, setSchoolData] = useState<any | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('school_portal_token')
    }
    return null
  })

  // Fetch Captcha
  const fetchCaptcha = async () => {
    setCaptchaLoading(true)
    setError('')
    try {
      const res = await fetch('/api/school/portal/captcha')
      const data = await res.json()
      if (data.success) {
        setCaptchaQuestion(data.question)
        setCaptchaToken(data.captchaToken)
        setCaptchaAnswer('')
      } else {
        setError(data.error || 'Failed to generate captcha.')
      }
    } catch (err) {
      console.error(err)
      setError('Network error while generating captcha.')
    } finally {
      setCaptchaLoading(false)
    }
  }

  useEffect(() => {
    fetchCaptcha()
  }, [])

  // Auto-verify if sessionToken exists
  useEffect(() => {
    if (sessionToken && udise) {
      handleVerify(true)
    }
  }, [])

  const handleVerify = async (useSession = false) => {
    if (!udise.trim()) {
      setError(lang === 'hi' ? 'कृपया स्कूल का UDISE नंबर दर्ज करें।' : 'Please enter the school UDISE number.')
      return
    }

    if (!useSession && !captchaAnswer.trim()) {
      setError(lang === 'hi' ? 'कृपया कैप्चा उत्तर दर्ज करें।' : 'Please enter the captcha answer.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload: any = {
        udise: udise.trim(),
        language: lang,
      }

      if (useSession && sessionToken) {
        payload.sessionToken = sessionToken
      } else {
        payload.captchaToken = captchaToken
        payload.captchaAnswer = captchaAnswer.trim()
      }

      const res = await fetch('/api/school/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        setSchoolData(data)
        if (data.sessionToken) {
          setSessionToken(data.sessionToken)
          sessionStorage.setItem('school_portal_token', data.sessionToken)
        }
      } else {
        setError(data.error || 'Verification failed. Please check UDISE and Captcha.')
        // Refresh captcha on failure
        fetchCaptcha()
      }
    } catch (err) {
      console.error(err)
      setError('Network error during verification.')
      fetchCaptcha()
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutSchool = () => {
    setSchoolData(null)
    setSessionToken(null)
    sessionStorage.removeItem('school_portal_token')
    fetchCaptcha()
  }

  // If already verified, show the verified School Portal Dashboard
  if (schoolData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
        {/* Top Navbar */}
        <header style={{
          backgroundColor: '#0b2240',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={appIconSrc || defaultIconAsset} 
              alt="Logo" 
              style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'contain', backgroundColor: '#fff', padding: '2px' }} 
            />
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 'bold', fontSize: '1.1rem', color: '#f5d782' }}>
                {t.schoolPortalTitle || 'School Results & Rankings Portal'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                {schoolData.school.name} (UDISE: {schoolData.school.udise})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Language Switcher */}
            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '3px', borderRadius: '6px' }}>
              <button
                onClick={() => onChangeLang('en')}
                style={{
                  background: lang === 'en' ? '#f5d782' : 'transparent',
                  color: lang === 'en' ? '#0b2240' : '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: lang === 'en' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                English
              </button>
              <button
                onClick={() => onChangeLang('hi')}
                style={{
                  background: lang === 'hi' ? '#f5d782' : 'transparent',
                  color: lang === 'hi' ? '#0b2240' : '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: lang === 'hi' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                हिन्दी
              </button>
            </div>

            <button
              onClick={handleLogoutSchool}
              className="btn btn-secondary"
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                textTransform: 'none',
                borderColor: '#94a3b8',
                color: '#ffffff',
                backgroundColor: 'rgba(255,255,255,0.08)'
              }}
            >
              <LogOut size={14} />
              {t.schoolPortalExit || 'Exit Portal'}
            </button>
          </div>
        </header>

        {/* School Portal Content */}
        <div className="container" style={{ marginTop: '1.5rem', paddingBottom: '3rem' }}>
          <SchoolPortalRankingsDashboard 
            schoolData={schoolData} 
            lang={lang} 
            token={null} 
          />
          <div style={{ textAlign: 'center', marginTop: '2.5rem', padding: '1rem 0', color: '#64748b', fontSize: '0.85rem' }}>
            powered by Neopace Infotech LLP
          </div>
        </div>
      </div>
    )
  }

  // Verification Login Card
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1.5rem'
    }}>
      {/* Top Brand Logo */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img 
          src={appIconSrc || defaultIconAsset} 
          alt="App Icon" 
          style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '0.75rem' }} 
        />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--primary-navy)', margin: 0 }}>
          {t.schoolPortalTitle || 'School Results & Rankings Portal'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {t.schoolPortalSub || 'Access live student rankings, attempts, and download reports'}
        </p>
      </div>

      {/* Verification Card */}
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        {/* Language Selection Header inside Card */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
            <button
              type="button"
              onClick={() => onChangeLang('en')}
              style={{
                background: lang === 'en' ? '#0b2240' : 'transparent',
                color: lang === 'en' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: lang === 'en' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('hi')}
              style={{
                background: lang === 'hi' ? '#0b2240' : 'transparent',
                color: lang === 'hi' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: lang === 'hi' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleVerify(false); }}>
          {/* UDISE Number Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              {t.schoolPortalEnterUdise || 'Enter School UDISE Number'} <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder={t.schoolPortalUdisePlaceholder || 'e.g. 2724810202'}
                value={udise}
                onChange={(e) => setUdise(e.target.value)}
                required
                style={{
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.95rem',
                  margin: 0,
                  width: '100%',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
              />
            </div>
          </div>

          {/* Captcha Security Box */}
          <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', margin: 0 }}>
                {t.schoolPortalCaptcha || 'Security Verification Captcha'} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <button
                type="button"
                onClick={fetchCaptcha}
                disabled={captchaLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-navy)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  textDecoration: 'underline'
                }}
              >
                <RotateCw size={13} className={captchaLoading ? 'spin' : ''} />
                {t.schoolPortalRefreshCaptcha || 'Refresh'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{
                backgroundColor: '#1e293b',
                color: '#f5d782',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                letterSpacing: '2px',
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                userSelect: 'none',
                minWidth: '130px',
                textAlign: 'center',
                fontFamily: 'monospace',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {captchaLoading ? '...' : captchaQuestion || '...'}
              </div>

              <input
                type="number"
                className="form-input"
                placeholder={t.schoolPortalCaptchaPlaceholder || 'Enter answer'}
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                style={{
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.95rem',
                  margin: 0,
                  flex: 1
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'none'
            }}
          >
            <ShieldCheck size={18} />
            {loading ? (t.schoolPortalVerifying || 'Verifying...') : (t.schoolPortalAccessBtn || 'Access School Rankings')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ← Back to Student / Admin Portal
          </button>
        </div>
      </div>
    </div>
  )
}

// Full School Rankings and Attempt Dashboard for the Verified School Portal
function SchoolPortalRankingsDashboard({ 
  schoolData, 
  lang,
  token 
}: { 
  schoolData: any
  lang: Language
  token: string | null 
}) {
  const t = translations[lang || 'en']
  const [tab, setTab] = useState<'RANKINGS' | 'ATTEMPTS' | 'STUDENTS'>('RANKINGS')

  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')

  const classroomsList = schoolData.school.classrooms || []
  const examsList = schoolData.exams || []
  const groups = schoolData.groups || []

  // Calculate live rankings from completed attempts with dynamic filters
  const rankedAttempts = React.useMemo(() => {
    let completed = (schoolData.attempts || []).filter((att: any) => att.completed)

    if (selectedClassroomId) {
      completed = completed.filter((att: any) => att.classroomId === selectedClassroomId)
    }

    if (selectedExamId) {
      completed = completed.filter((att: any) => att.examId === selectedExamId)
    }

    if (selectedGroupId) {
      const groupObj = groups.find((g: any) => g.id === selectedGroupId)
      if (groupObj) {
        const allowedClassroomIds = groupObj.classrooms.map((c: any) => c.id)
        completed = completed.filter((att: any) => allowedClassroomIds.includes(att.classroomId))
      } else {
        completed = []
      }
    }

    if (startDate) {
      const fromLimit = new Date(startTime ? `${startDate}T${startTime}:00` : `${startDate}T00:00:00`)
      completed = completed.filter((att: any) => new Date(att.submittedAt) >= fromLimit)
    }

    if (endDate) {
      const toLimit = new Date(endTime ? `${endDate}T${endTime}:00` : `${endDate}T23:59:59`)
      completed = completed.filter((att: any) => new Date(att.submittedAt) <= toLimit)
    }

    completed = [...completed].sort((a: any, b: any) => {
      // 1. Marks Obtained
      const scoreA = a.score !== undefined && a.score !== null ? Number(a.score) : 0
      const scoreB = b.score !== undefined && b.score !== null ? Number(b.score) : 0
      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }

      // 2. Exam Completion Time
      const subA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity
      const subB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity
      const startA = a.startedAt ? new Date(a.startedAt).getTime() : subA
      const startB = b.startedAt ? new Date(b.startedAt).getTime() : subB
      const durA = Math.max(0, subA - startA)
      const durB = Math.max(0, subB - startB)
      if (durA !== durB) {
        return durA - durB
      }

      // 3. First Submission
      return subA - subB
    })

    return completed.map((att: any, index: number) => ({
      ...att,
      rank: index + 1
    }))
  }, [schoolData.attempts, selectedClassroomId, selectedExamId, selectedGroupId, groups, startDate, startTime, endDate, endTime])

  // Filtered Attempts for the Attempts Tab
  const filteredAttempts = React.useMemo(() => {
    let list = schoolData.attempts || []

    if (selectedClassroomId) {
      list = list.filter((att: any) => att.classroomId === selectedClassroomId)
    }

    if (selectedExamId) {
      list = list.filter((att: any) => att.examId === selectedExamId)
    }

    if (selectedGroupId) {
      const groupObj = groups.find((g: any) => g.id === selectedGroupId)
      if (groupObj) {
        const allowedClassroomIds = groupObj.classrooms.map((c: any) => c.id)
        list = list.filter((att: any) => allowedClassroomIds.includes(att.classroomId))
      } else {
        list = []
      }
    }

    if (startDate) {
      const fromLimit = new Date(startTime ? `${startDate}T${startTime}:00` : `${startDate}T00:00:00`)
      list = list.filter((att: any) => new Date(att.startedAt || att.submittedAt) >= fromLimit)
    }

    if (endDate) {
      const toLimit = new Date(endTime ? `${endDate}T${endTime}:00` : `${endDate}T23:59:59`)
      list = list.filter((att: any) => new Date(att.startedAt || att.submittedAt) <= toLimit)
    }

    return list
  }, [schoolData.attempts, selectedClassroomId, selectedExamId, selectedGroupId, groups, startDate, startTime, endDate, endTime])

  const handleDownloadRankingsCSV = () => {
    if (rankedAttempts.length === 0) return
    const headers = [
      'Rank in School', 'Student Name', 'Mobile', 'School Name', 'UDISE', 'Class Name', 
      'District', 'Tehsil', 'Exam Name', 'Score / Marks', 'Correct Answers', 'Total Questions', 
      'Duration (Minutes)', 'Completion Date'
    ]

    const rows = rankedAttempts.map((r: any) => [
      r.rank,
      r.studentName,
      r.studentMobile || '-',
      schoolData.school.name,
      schoolData.school.udise,
      r.classroomName,
      r.district || schoolData.school.district || '-',
      r.tehsil || schoolData.school.tehsil || '-',
      r.examName,
      r.score,
      r.correctAnswers !== undefined ? r.correctAnswers : '-',
      r.totalQuestions !== undefined ? r.totalQuestions : '-',
      r.durationMinutes || '-',
      r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'
    ])

    const cleanSchool = schoolData.school.name.replace(/\s+/g, '_')
    downloadCSV(`${cleanSchool}_${schoolData.school.udise}_Live_Rankings.csv`, headers, rows)
  }

  const handleDownloadRankingsExcel = () => {
    if (rankedAttempts.length === 0) return
    const headers = [
      'Rank in School', 'Student Name', 'Mobile', 'School Name', 'UDISE', 'Class Name', 
      'District', 'Tehsil', 'Exam Name', 'Score / Marks', 'Correct Answers', 'Total Questions', 
      'Duration (Minutes)', 'Completion Date'
    ]

    const rows = rankedAttempts.map((r: any) => [
      r.rank,
      r.studentName,
      r.studentMobile || '-',
      schoolData.school.name,
      schoolData.school.udise,
      r.classroomName,
      r.district || schoolData.school.district || '-',
      r.tehsil || schoolData.school.tehsil || '-',
      r.examName,
      r.score,
      r.correctAnswers !== undefined ? r.correctAnswers : '-',
      r.totalQuestions !== undefined ? r.totalQuestions : '-',
      r.durationMinutes || '-',
      r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'
    ])

    const worksheetData = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'School Rankings')

    const cleanSchool = schoolData.school.name.replace(/\s+/g, '_')
    XLSX.writeFile(workbook, `${cleanSchool}_${schoolData.school.udise}_Live_Rankings.xlsx`)
  }

  const handleDownloadRankingsPDF = () => {
    if (rankedAttempts.length === 0) return
    const examObj = examsList.find((e: any) => e.id === selectedExamId)
    const groupObj = groups.find((g: any) => g.id === selectedGroupId)
    const classObj = classroomsList.find((c: any) => c.id === selectedClassroomId)

    generateSchoolReportPDF({
      schoolName: schoolData.school.name,
      udise: schoolData.school.udise,
      district: schoolData.school.district,
      tehsil: schoolData.school.tehsil,
      filterExam: examObj ? examObj.name : undefined,
      filterGroup: groupObj ? groupObj.name : undefined,
      filterClassroom: classObj ? classObj.name : undefined,
      language: lang,
      reportType: 'RANKINGS',
      results: rankedAttempts
    })
  }

  const handleDownloadAttemptsCSV = () => {
    if (filteredAttempts.length === 0) return
    const headers = [
      'Sr No', 'Student Name', 'Mobile', 'School Name', 'UDISE', 'Class Name', 
      'District', 'Tehsil', 'Exam Name', 'Score / Marks', 'Status', 'Completion Date'
    ]

    const rows = filteredAttempts.map((att: any, idx: number) => [
      idx + 1,
      att.studentName,
      att.studentMobile || '-',
      schoolData.school.name,
      schoolData.school.udise,
      att.classroomName,
      att.district || schoolData.school.district || '-',
      att.tehsil || schoolData.school.tehsil || '-',
      att.examName,
      att.score,
      att.completed ? 'Completed' : 'In Progress',
      att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '-'
    ])

    const cleanSchool = schoolData.school.name.replace(/\s+/g, '_')
    downloadCSV(`${cleanSchool}_${schoolData.school.udise}_Exam_Attempts.csv`, headers, rows)
  }

  const handleDownloadAttemptsExcel = () => {
    if (filteredAttempts.length === 0) return
    const headers = [
      'Sr No', 'Student Name', 'Mobile', 'School Name', 'UDISE', 'Class Name', 
      'District', 'Tehsil', 'Exam Name', 'Score / Marks', 'Status', 'Completion Date'
    ]

    const rows = filteredAttempts.map((att: any, idx: number) => [
      idx + 1,
      att.studentName,
      att.studentMobile || '-',
      schoolData.school.name,
      schoolData.school.udise,
      att.classroomName,
      att.district || schoolData.school.district || '-',
      att.tehsil || schoolData.school.tehsil || '-',
      att.examName,
      att.score,
      att.completed ? 'Completed' : 'In Progress',
      att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '-'
    ])

    const worksheetData = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Attempts')

    const cleanSchool = schoolData.school.name.replace(/\s+/g, '_')
    XLSX.writeFile(workbook, `${cleanSchool}_${schoolData.school.udise}_Exam_Attempts.xlsx`)
  }

  const handleDownloadAttemptsPDF = () => {
    if (filteredAttempts.length === 0) return
    generateSchoolReportPDF({
      schoolName: schoolData.school.name,
      udise: schoolData.school.udise,
      district: schoolData.school.district,
      tehsil: schoolData.school.tehsil,
      language: lang,
      reportType: 'ATTEMPTS',
      results: filteredAttempts
    })
  }

  return (
    <div className="card" style={{ height: 'fit-content' }}>
      {/* School Header Banner */}
      <div style={{ borderBottom: '1px solid var(--border-muted)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '0.35rem', color: 'var(--primary-navy)' }}>
          {schoolData.school.name}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
          <span className="badge badge-outline" style={{ fontSize: '0.85rem', textTransform: 'none' }}>
            UDISE: {schoolData.school.udise}
          </span>
          {schoolData.school.tehsil && (
            <span className="badge badge-outline" style={{ fontSize: '0.85rem', textTransform: 'none' }}>
              Tehsil: {schoolData.school.tehsil}
            </span>
          )}
          {schoolData.school.district && (
            <span className="badge badge-outline" style={{ fontSize: '0.85rem', textTransform: 'none' }}>
              District: {schoolData.school.district}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Linked Classes:</span>
          {classroomsList.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No classes linked</span>
          ) : (
            classroomsList.map((c: any) => (
              <span key={c.id} className="badge badge-outline" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderColor: 'var(--primary-navy)', color: 'var(--primary-navy)' }}>
                {c.name}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-muted)', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
        <button
          onClick={() => setTab('RANKINGS')}
          className="btn-text"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '0.95rem',
            padding: '0.5rem 1rem',
            color: tab === 'RANKINGS' ? 'var(--primary-navy)' : 'var(--text-muted)',
            borderBottom: tab === 'RANKINGS' ? '2px solid var(--accent-gold)' : 'none',
          }}
        >
          🏆 {t.schoolPortalRankingsTab || 'Live Rankings'} ({rankedAttempts.length})
        </button>
        <button
          onClick={() => setTab('ATTEMPTS')}
          className="btn-text"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '0.95rem',
            padding: '0.5rem 1rem',
            color: tab === 'ATTEMPTS' ? 'var(--primary-navy)' : 'var(--text-muted)',
            borderBottom: tab === 'ATTEMPTS' ? '2px solid var(--accent-gold)' : 'none',
          }}
        >
          {t.schoolPortalAttemptsTab || 'Exam Attempts & Submissions'} ({filteredAttempts.length})
        </button>
        <button
          onClick={() => setTab('STUDENTS')}
          className="btn-text"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '0.95rem',
            padding: '0.5rem 1rem',
            color: tab === 'STUDENTS' ? 'var(--primary-navy)' : 'var(--text-muted)',
            borderBottom: tab === 'STUDENTS' ? '2px solid var(--accent-gold)' : 'none',
          }}
        >
          {t.schoolPortalStudentsTab || 'Registered Students'} ({schoolData.students.length})
        </button>
      </div>

      {/* Tab: RANKINGS */}
      {tab === 'RANKINGS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filters Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            backgroundColor: 'var(--bg-muted, #f8f9fa)', 
            padding: '0.75rem 1rem', 
            borderRadius: '6px', 
            border: '1px solid var(--border-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Exam:</span>
              <select
                className="form-input"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', height: '34px', margin: 0, width: '160px' }}
              >
                <option value="">All Exams</option>
                {examsList.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Group:</span>
              <select
                className="form-input"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', height: '34px', margin: 0, width: '150px' }}
              >
                <option value="">All Groups</option>
                {groups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Classroom:</span>
              <select
                className="form-input"
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', height: '34px', margin: 0, width: '150px' }}
              >
                <option value="">All Classrooms</option>
                {classroomsList.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>From:</span>
              <input 
                type="date" 
                className="form-input" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                style={{ padding: '0.35rem 0.5rem', margin: 0, fontSize: '0.85rem', width: '130px', height: '34px', boxSizing: 'border-box' }} 
              />
              <input 
                type="time" 
                className="form-input" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                style={{ padding: '0.35rem 0.4rem', margin: 0, fontSize: '0.85rem', width: '80px', height: '34px', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>To:</span>
              <input 
                type="date" 
                className="form-input" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={{ padding: '0.35rem 0.5rem', margin: 0, fontSize: '0.85rem', width: '130px', height: '34px', boxSizing: 'border-box' }} 
              />
              <input 
                type="time" 
                className="form-input" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                style={{ padding: '0.35rem 0.4rem', margin: 0, fontSize: '0.85rem', width: '80px', height: '34px', boxSizing: 'border-box' }} 
              />
            </div>

            {(selectedExamId || selectedClassroomId || selectedGroupId || startDate || startTime || endDate || endTime) && (
              <button
                onClick={() => {
                  setSelectedExamId('')
                  setSelectedClassroomId('')
                  setSelectedGroupId('')
                  setStartDate('')
                  setStartTime('')
                  setEndDate('')
                  setEndTime('')
                }}
                className="btn btn-secondary"
                style={{ 
                  padding: '0.35rem 0.6rem', 
                  fontSize: '0.8rem', 
                  textTransform: 'none', 
                  marginLeft: 'auto' 
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Action Row with Export Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Showing <strong>{rankedAttempts.length}</strong> ranked students
            </div>
            {rankedAttempts.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownloadRankingsCSV}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={15} />
                  {t.schoolPortalDownloadCsv || 'Download CSV'}
                </button>
                <button
                  onClick={handleDownloadRankingsExcel}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.85rem', 
                    textTransform: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    backgroundColor: '#107c41',
                    borderColor: '#107c41'
                  }}
                >
                  <FileText size={15} />
                  {t.schoolPortalDownloadExcel || 'Download Excel'}
                </button>
                <button
                  onClick={handleDownloadRankingsPDF}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.85rem', 
                    textTransform: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    backgroundColor: '#dc2626',
                    borderColor: '#dc2626'
                  }}
                >
                  <Download size={15} />
                  {t.schoolPortalDownloadPdf || 'Download PDF'}
                </button>
              </div>
            )}
          </div>

          {/* Rankings Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Exam Name</th>
                  <th>Score / Marks</th>
                  <th>Duration</th>
                  <th>Submission Date</th>
                </tr>
              </thead>
              <tbody>
                {rankedAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No completed exam records available to compute rankings yet.
                    </td>
                  </tr>
                ) : (
                  rankedAttempts.map((att: any) => (
                    <tr key={att.id} style={{ backgroundColor: att.rank === 1 ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 'bold',
                            backgroundColor: att.rank === 1 ? '#d4af37' : att.rank === 2 ? '#c0c0c0' : att.rank === 3 ? '#cd7f32' : 'transparent',
                            color: att.rank <= 3 ? '#ffffff' : 'inherit',
                            border: att.rank <= 3 ? 'none' : '1px solid var(--border-muted)',
                          }}
                        >
                          {att.rank === 1 ? '🥇 1st' : att.rank === 2 ? '🥈 2nd' : att.rank === 3 ? '🥉 3rd' : `${att.rank}th`}
                        </span>
                      </td>
                      <td><strong>{att.studentName}</strong></td>
                      <td>{att.classroomName}</td>
                      <td>{att.examName}</td>
                      <td>
                        <strong>{att.score} marks</strong>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {att.durationMinutes ? `${att.durationMinutes} min` : '-'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(att.submittedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: ATTEMPTS */}
      {tab === 'ATTEMPTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Total Attempts: <strong>{filteredAttempts.length}</strong>
            </div>
            {filteredAttempts.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownloadAttemptsCSV}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={15} />
                  {t.schoolPortalDownloadCsv || 'Download CSV'}
                </button>
                <button
                  onClick={handleDownloadAttemptsExcel}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.85rem', 
                    textTransform: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    backgroundColor: '#107c41',
                    borderColor: '#107c41'
                  }}
                >
                  <FileText size={15} />
                  {t.schoolPortalDownloadExcel || 'Download Excel'}
                </button>
                <button
                  onClick={handleDownloadAttemptsPDF}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.85rem', 
                    textTransform: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    backgroundColor: '#dc2626',
                    borderColor: '#dc2626'
                  }}
                >
                  <Download size={15} />
                  {t.schoolPortalDownloadPdf || 'Download PDF'}
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Exam Name</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date Completed</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No exam attempts recorded under this school yet.
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((att: any) => (
                    <tr key={att.id}>
                      <td><strong>{att.studentName}</strong></td>
                      <td>{att.classroomName}</td>
                      <td>{att.examName}</td>
                      <td>
                        <strong>{att.score} marks</strong>
                      </td>
                      <td>
                        {att.completed ? (
                          <span style={{ backgroundColor: '#e6f4ea', color: '#137333', border: '1px solid #ceead6', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ Completed
                          </span>
                        ) : (
                          <span className="badge badge-outline">In Progress</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: STUDENTS */}
      {tab === 'STUDENTS' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Mobile</th>
                <th>Location</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {schoolData.students.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No students registered under this school.
                  </td>
                </tr>
              ) : (
                schoolData.students.map((std: any) => (
                  <tr key={std.id}>
                    <td><strong>{std.name}</strong></td>
                    <td>{std.classroomName}</td>
                    <td>{std.mobile}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      Dist: {std.district}<br />Tehsil: {std.tehsil}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(std.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
