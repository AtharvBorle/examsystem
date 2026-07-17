import React, { useState, useEffect, useRef } from 'react'
import { translations, Language } from '../utils/localization'
import { useAuth } from '../context/AuthContext'
import { Search, Phone, Lock } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'

/* ==========================================
   VIEW: LOGIN
   ========================================== */
export function LoginView({ onViewRegister, lang, onChangeLang }: { onViewRegister: () => void; lang: Language; onChangeLang: (lang: Language) => void }) {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Keep only numeric characters and limit to 10 digits
    const numericVal = val.replace(/\D/g, '').slice(0, 10)
    setIdentifier(numericVal)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (identifier.length !== 10) {
      setError(lang === 'hi' ? 'कृपया एक वैध 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const data = await res.json()
      if (data.success) {
        login(data.token, data.user)
      } else {
        setError(data.error || 'Login failed. Please check credentials.')
      }
    } catch (err) {
      setError('Connection to server failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const t = translations[lang]

  return (
    <div className="mobile-login-container">
      {/* Top bar with mobile app icon as logo, and LanguageSelector */}
      <div className="mobile-login-topbar">
        <img src="/app_icon.jpeg" className="mobile-logo-img" alt="Logo" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSelector lang={lang} onChangeLang={onChangeLang} isDark={false} />
        </div>
      </div>

      <div className="mobile-login-card">
        <h2>{lang === 'hi' ? 'स्वागत है' : 'Welcome'}</h2>
        <p className="sub">
          {lang === 'hi' ? (
            <>ऑनलाइन परीक्षा<br />प्रबंधन प्रणाली</>
          ) : (
            <>Online Exam<br />Management System</>
          )}
        </p>

        {error && <div className="alert alert-danger" style={{ width: '100%', fontSize: '0.85rem', padding: '0.75rem', borderRadius: '10px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="mobile-input-wrapper">
            <span className="mobile-input-icon">
              <Phone size={20} strokeWidth={1.5} />
            </span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              className="mobile-input-field"
              value={identifier}
              onChange={handleIdentifierChange}
              placeholder={lang === 'hi' ? 'मोबाइल' : 'Mobile'}
              required
            />
          </div>

          <div className="mobile-input-wrapper">
            <span className="mobile-input-icon">
              <Lock size={20} strokeWidth={1.5} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              className="mobile-input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={lang === 'hi' ? 'पासवर्ड' : 'Password'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="mobile-password-toggle"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            className="mobile-login-btn"
            disabled={submitting}
          >
            {submitting ? (lang === 'hi' ? 'लॉगिन किया जा रहा है...' : 'Authenticating...') : (lang === 'hi' ? 'लॉगिन' : 'Login')}
          </button>
        </form>

        <div className="mobile-register-prompt">
          {lang === 'hi' ? 'खाता नहीं है?' : "Don't have an account?"}{' '}
          <button onClick={onViewRegister} className="mobile-register-link">
            {lang === 'hi' ? 'यहाँ पंजीकरण करें' : 'Register Here'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==========================================
   VIEW: REGISTER (STUDENT)
   ========================================== */
export function RegisterView({ onViewLogin, lang, onChangeLang }: { onViewLogin: () => void; lang: Language; onChangeLang: (lang: Language) => void }) {
  const { login } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [district, setDistrict] = useState('')
  const [tehsil, setTehsil] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // OTP state variables
  const [otp, setOtp] = useState('')
  const [sentOtp, setSentOtp] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpSuccess, setOtpSuccess] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [expiryCountdown, setExpiryCountdown] = useState(0)

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  useEffect(() => {
    if (expiryCountdown <= 0) return
    const timer = setInterval(() => {
      setExpiryCountdown((prev) => {
        if (prev <= 1) {
          // OTP expired!
          setOtpError(lang === 'hi' ? 'OTP की समय सीमा समाप्त हो गई है। कृपया पुनः भेजें।' : 'OTP has expired. Please request a new one.')
          setOtpSuccess('')
          setOtpSent(false)
          setOtp('')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [expiryCountdown, lang])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleSendOtp = async () => {
    setOtpError('')
    setOtpSuccess('')
    setOtpLoading(true)
    try {
      const res = await fetch('/api/student/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })
      const data = await res.json()
      if (data.success) {
        setOtpSent(true)
        setResendCountdown(60) // 60 seconds resend countdown
        setExpiryCountdown(600) // 10 minutes expiry countdown (600 seconds)
        setOtpSuccess(translations[lang].otpSentMsg)
      } else {
        setOtpError(data.error || translations[lang].otpSendError)
      }
    } catch (err) {
      setOtpError(translations[lang].otpSendError)
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setOtpError('')
    setOtpSuccess('')
    setOtpVerifying(true)
    try {
      const res = await fetch('/api/student/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      })
      const data = await res.json()
      if (data.success) {
        setIsOtpVerified(true)
        setOtpSuccess(translations[lang].otpVerifySuccess)
        setExpiryCountdown(0) // clear expiry timer once verified
      } else {
        setOtpError(data.error || translations[lang].otpVerifyError)
      }
    } catch (err) {
      setOtpError(translations[lang].otpVerifyError)
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleResetOtp = () => {
    setOtp('')
    setSentOtp(null)
    setOtpSent(false)
    setIsOtpVerified(false)
    setOtpError('')
    setOtpSuccess('')
    setResendCountdown(0)
    setExpiryCountdown(0)
  }

  // School lookup states
  const [schoolSearch, setSchoolSearch] = useState('')
  const [schoolList, setSchoolList] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null)
  const [showSchoolPopover, setShowSchoolPopover] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Classroom list states
  const [classroomList, setClassroomList] = useState<any[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState('')

  // Close school popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSchoolPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Query schools as user types
  useEffect(() => {
    if (schoolSearch.trim().length === 0) {
      setSchoolList([])
      return
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/student/schools?search=${encodeURIComponent(schoolSearch)}&language=${lang}`)
        const data = await res.json()
        if (data.success) {
          setSchoolList(data.schools)
        }
      } catch (err) {
        console.error(err)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [schoolSearch, lang])

  // Fetch classrooms when school changes
  const handleSelectSchool = async (school: any) => {
    setSelectedSchool(school)
    setSchoolSearch(school.name)
    setShowSchoolPopover(false)
    setClassroomList([])
    setSelectedClassroom('')

    if (school.district) {
      setDistrict(school.district)
    }
    if (school.tehsil) {
      setTehsil(school.tehsil)
    }

    try {
      const res = await fetch(`/api/student/classrooms?schoolId=${school.id}&language=${lang}`)
      const data = await res.json()
      if (data.success) {
        setClassroomList(data.classrooms)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedSchool) {
      setError(lang === 'hi' ? 'कृपया ड्रॉपडाउन सूची से एक स्कूल चुनें।' : 'Please select a school from the dropdown list.')
      return
    }
    if (!selectedClassroom) {
      setError(lang === 'hi' ? 'कृपया एक कक्षा चुनें।' : 'Please select a classroom.')
      return
    }

    // First and last name validations
    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const nameRegex = /^[A-Za-z\s\u0900-\u097F]+$/
    if (trimmedFirstName.length < 1 || trimmedFirstName.length > 25 || !nameRegex.test(trimmedFirstName)) {
      setError(translations[lang].errFirstNameInvalid)
      return
    }
    if (trimmedLastName.length < 1 || trimmedLastName.length > 25 || !nameRegex.test(trimmedLastName)) {
      setError(translations[lang].errLastNameInvalid)
      return
    }
    const fullName = `${trimmedFirstName} ${trimmedLastName}`
    if (fullName.length < 2 || fullName.length > 50) {
      setError(translations[lang].errNameInvalid)
      return
    }

    // Mobile number validation
    const mobileRegex = /^[6-9]\d{9}$/
    if (!mobileRegex.test(mobile)) {
      setError(translations[lang].errMobileInvalid)
      return
    }

    // Password validation
    if (password.length < 6) {
      setError(translations[lang].errPasswordInvalid)
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          schoolId: selectedSchool.id,
          classroomId: selectedClassroom,
          district,
          tehsil,
          mobile,
          password,
          language: lang,
        }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.pendingApproval) {
          alert(translations[lang].pendingApprovalMsg)
          login(data.token, data.user)
        } else {
          login(data.token, data.user)
        }
      } else {
        setError(data.error || 'Registration failed.')
      }
    } catch (err) {
      setError('Connection to server failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const t = translations[lang]

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
          <LanguageSelector lang={lang} onChangeLang={onChangeLang} isDark={false} />
        </div>
        <div className="auth-header">
          <h1>{t.studentRegistration}</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {t.subRegister}
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleRegister}>
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t.firstName}</label>
              <input
                type="text"
                className="form-input"
                value={firstName}
                onChange={(e) => {
                  const val = e.target.value
                  const filtered = val.replace(/[^A-Za-z\s\u0900-\u097F]/g, '')
                  if (filtered.length <= 25) {
                    setFirstName(filtered)
                  }
                }}
                placeholder={t.placeholderFirstName}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t.lastName}</label>
              <input
                type="text"
                className="form-input"
                value={lastName}
                onChange={(e) => {
                  const val = e.target.value
                  const filtered = val.replace(/[^A-Za-z\s\u0900-\u097F]/g, '')
                  if (filtered.length <= 25) {
                    setLastName(filtered)
                  }
                }}
                placeholder={t.placeholderLastName}
                required
              />
            </div>
          </div>

          <div className="form-group searchable-select-container" ref={popoverRef}>
            <label className="form-label">{t.schoolUdise}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                value={schoolSearch}
                onChange={(e) => {
                  setSchoolSearch(e.target.value)
                  setSelectedSchool(null)
                  setShowSchoolPopover(true)
                }}
                onFocus={() => setShowSchoolPopover(true)}
                placeholder={t.placeholderSearchSchool}
                required
              />
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
            {showSchoolPopover && schoolList.length > 0 && (
              <div className="search-results-popover">
                {schoolList.map((sch) => (
                  <div key={sch.id} className="search-result-item" onClick={() => handleSelectSchool(sch)}>
                    <strong>{sch.name}</strong> <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(UDISE: {sch.udise})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">{t.classClassroom}</label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              disabled={!selectedSchool}
              required
            >
              <option value="">{t.selectClass}</option>
              {classroomList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {!selectedSchool && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t.selectSchoolFirst}
              </span>
            )}
          </div>

          <div className="grid-2" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.district}</label>
              <input
                type="text"
                className="form-input"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t.district}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.tehsil}</label>
              <input
                type="text"
                className="form-input"
                value={tehsil}
                onChange={(e) => setTehsil(e.target.value)}
                placeholder={t.tehsil}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t.mobileUnique}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="tel"
                className="form-input"
                value={mobile}
                onChange={(e) => {
                  if (isOtpVerified) return
                  const val = e.target.value
                  const filtered = val.replace(/[^0-9]/g, '')
                  if (filtered.length <= 10) {
                    setMobile(filtered)
                  }
                }}
                placeholder={t.placeholderMobile}
                maxLength={10}
                pattern="[0-9]{10}"
                disabled={isOtpVerified}
                style={{
                  flex: 1,
                  backgroundColor: isOtpVerified ? 'var(--bg-card-muted, #f5f5f5)' : undefined,
                  cursor: isOtpVerified ? 'not-allowed' : undefined
                }}
                required
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSendOtp}
                disabled={mobile.length !== 10 || otpLoading || isOtpVerified || resendCountdown > 0}
                style={{
                  whiteSpace: 'nowrap',
                  opacity: (mobile.length === 10 && !otpLoading && !isOtpVerified && resendCountdown === 0) ? 1 : 0.6,
                  cursor: (mobile.length === 10 && !otpLoading && !isOtpVerified && resendCountdown === 0) ? 'pointer' : 'not-allowed'
                }}
              >
                {otpLoading
                  ? t.sending
                  : resendCountdown > 0
                    ? `${otpSent ? t.resendOtp : t.sendOtp} (${resendCountdown}s)`
                    : otpSent ? t.resendOtp : t.sendOtp}
              </button>
            </div>
            {otpError && !isOtpVerified && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-danger, #d32f2f)', marginTop: '4px', display: 'block' }}>
                {otpError}
              </span>
            )}
            {otpSuccess && !isOtpVerified && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-success, #2e7d32)', marginTop: '4px', display: 'block' }}>
                {otpSuccess}
              </span>
            )}
            {isOtpVerified && (
              <div style={{ marginTop: '4px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-success, #2e7d32)', fontWeight: 'bold' }}>✓ {t.otpVerifySuccess}</span>
                <button
                  type="button"
                  onClick={handleResetOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-navy, #002244)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.8rem'
                  }}
                >
                  {t.changeNumber}
                </button>
              </div>
            )}
          </div>

          {otpSent && !isOtpVerified && (
            <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>{t.enterOtp}</label>
                {expiryCountdown > 0 && (
                  <span style={{ fontSize: '0.8rem', color: '#ff9800', fontWeight: 'bold' }}>
                    {lang === 'hi' ? `वैधता: ${formatTime(expiryCountdown)}` : `Expires in: ${formatTime(expiryCountdown)}`}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    if (val.length <= 6) {
                      setOtp(val)
                    }
                  }}
                  placeholder="6-digit OTP"
                  maxLength={6}
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || otpVerifying}
                  style={{
                    whiteSpace: 'nowrap',
                    opacity: (otp.length === 6 && !otpVerifying) ? 1 : 0.6,
                    cursor: (otp.length === 6 && !otpVerifying) ? 'pointer' : 'not-allowed'
                  }}
                >
                  {otpVerifying ? t.sending : t.verifyOtp}
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t.password}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingRight: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.choosePassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{
              width: '100%',
              marginTop: '1rem',
              opacity: isOtpVerified ? 1 : 0.5,
              cursor: isOtpVerified ? 'pointer' : 'not-allowed',
              backgroundColor: isOtpVerified ? 'var(--primary-navy)' : '#cccccc',
              borderColor: isOtpVerified ? 'var(--primary-navy)' : '#cccccc',
              color: isOtpVerified ? '#ffffff' : '#666666'
            }}
            disabled={submitting || !isOtpVerified}
          >
            {submitting ? t.registering : t.register}
          </button>
        </form>

        <div className="auth-switch">
          {t.alreadyRegistered}{' '}
          <button onClick={onViewLogin} className="btn-text" style={{ textDecoration: 'underline', padding: 0 }}>
            {t.loginHere}
          </button>
        </div>
      </div>
    </div>
  )
}
