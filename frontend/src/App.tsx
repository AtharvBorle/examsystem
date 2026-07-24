import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth, User } from './context/AuthContext'
import { translations, Language } from './utils/localization'
import { LogOut } from 'lucide-react'
import { LoginView, RegisterView } from './components/AuthViews'
import { StandaloneSchoolDetailView, SuperAdminDashboard, AdminDashboard } from './components/AdminViews'
import { StudentDashboard } from './components/StudentViews'

import { LanguageSelector } from './components/LanguageSelector'

if (typeof window !== 'undefined') {
  const customAlert = (message: string) => {
    const existing = document.getElementById('custom-global-alert');
    if (existing) {
      document.body.removeChild(existing);
    }

    const alertEl = document.createElement('div');
    alertEl.id = 'custom-global-alert';
    alertEl.style.position = 'fixed';
    alertEl.style.top = '0';
    alertEl.style.left = '0';
    alertEl.style.width = '100vw';
    alertEl.style.height = '100vh';
    alertEl.style.backgroundColor = 'rgba(11, 26, 48, 0.75)';
    alertEl.style.display = 'flex';
    alertEl.style.justifyContent = 'center';
    alertEl.style.alignItems = 'center';
    alertEl.style.zIndex = '999999';
    alertEl.style.padding = '20px';
    alertEl.style.boxSizing = 'border-box';
    alertEl.style.fontFamily = 'var(--font-sans, sans-serif)';
    
    const isHindi = message.includes('पंजीकरण') || message.includes('लंबित') || message.includes('अस्वीकार') || message.includes('पंजीकृत') || message.includes('भाषा') || message.includes('प्रमाण पत्र');
    const buttonText = isHindi ? 'ठीक है' : 'OK';
    
    let titleText = isHindi ? 'सूचना' : 'Notification';
    let iconHtml = '📢'; // Default

    if (message.toLowerCase().includes('language') || message.includes('भाषा')) {
      iconHtml = '🌐';
      titleText = isHindi ? 'भाषा बदली गई' : 'Language Selection';
    } else if (message.toLowerCase().includes('certificate') || message.includes('प्रमाण पत्र')) {
      iconHtml = '🏆';
      titleText = isHindi ? 'प्रमाण पत्र' : 'Certificate';
    } else if (message.toLowerCase().includes('rejected') || message.includes('अस्वीकार')) {
      iconHtml = '❌';
      titleText = isHindi ? 'पंजीकरण अस्वीकृत' : 'Registration Rejected';
    } else if (message.toLowerCase().includes('pending') || message.includes('लंबित')) {
      iconHtml = '⏳';
      titleText = isHindi ? 'पंजीकरण लंबित' : 'Pending Approval';
    }

    alertEl.innerHTML = `
      <div style="
        background-color: #16253b;
        border: 2px solid #c5a059;
        border-radius: 12px;
        padding: 24px;
        width: 100%;
        max-width: 360px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        text-align: center;
        animation: alertScaleIn 0.2s ease-out;
      ">
        <style>
          @keyframes alertScaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        </style>
        <div style="font-size: 2.2rem; margin-bottom: 10px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          ${iconHtml}
        </div>
        <div style="font-family: var(--font-serif, serif); font-size: 1.25rem; font-weight: bold; color: #ffffff; margin-bottom: 12px; border-bottom: 1px solid rgba(197, 160, 89, 0.2); padding-bottom: 8px;">
          ${titleText}
        </div>
        <div style="font-size: 0.95rem; color: #e2e8f0; line-height: 1.5; margin-bottom: 24px; text-align: left; white-space: pre-line; word-break: break-all;">
          ${message}
        </div>
        <button id="custom-global-alert-btn" style="
          background-color: #c5a059;
          color: #0b1a30;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 0.95rem;
          cursor: pointer;
          width: 100%;
          outline: none;
        ">
          ${buttonText}
        </button>
      </div>
    `;

    document.body.appendChild(alertEl);

    const btn = document.getElementById('custom-global-alert-btn');
    btn?.focus();
    btn?.addEventListener('click', () => {
      document.body.removeChild(alertEl);
    });
  };
  (window as any).showCustomAlert = customAlert;
  window.alert = customAlert;
}

function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}

function MainLayout() {
  const { user, token, logout, loading, login } = useAuth()
  const [currentView, setCurrentView] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD'>('LOGIN')
  const [directSchoolUdise, setDirectSchoolUdise] = useState<string | null>(null)

  const [lang, setLang] = useState<Language>('en')

  const handleLanguageChange = async (newLang: Language) => {
    setLang(newLang)
    window.alert(newLang === 'hi'
      ? 'भाषा सफलतापूर्वक बदल दी गई है।'
      : 'Language changed successfully.'
    )
    if (user && token) {
      if (user.role === 'STUDENT') {
        try {
          const res = await fetch('/api/student/language', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ language: newLang })
          })
          const data = await res.json()
          if (data.success) {
            const updatedUser = {
              ...user,
              language: newLang,
              school: data.school || user.school,
              classroom: data.classroom || user.classroom
            }
            login(token, updatedUser)
          }
        } catch (err) {
          console.error('Failed to save language preference on backend:', err)
          login(token, { ...user, language: newLang })
        }
      } else {
        login(token, { ...user, language: newLang })
      }
    }
  }

  useEffect(() => {
    if (user && user.language) {
      setLang(user.language as Language)
    }
  }, [user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const udise = params.get('schoolDetailUdise') || params.get('schoolDetailId')
    if (udise) {
      setDirectSchoolUdise(udise)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setCurrentView('DASHBOARD')
    } else {
      setCurrentView('LOGIN')
    }
  }, [user])

  if (loading) {
    return (
      <div className="auth-container">
        <div className="font-serif text-lg">{translations[lang].loading}</div>
      </div>
    )
  }

  const isNew = import.meta.env.VITE_SPLASH_SCREEN_VERSION === 'new'
  const showNavbar = user && (!isNew || user.role !== 'STUDENT')

  return (
    <div>
      {showNavbar && <Navbar user={user} onLogout={logout} lang={lang} onChangeLang={handleLanguageChange} />}
      {directSchoolUdise && user && token ? (
        <StandaloneSchoolDetailView 
          schoolUdise={directSchoolUdise} 
          token={token} 
          onBackToDashboard={() => {
            window.history.replaceState({}, document.title, '/')
            setDirectSchoolUdise(null)
          }} 
        />
      ) : (
        <>
          {currentView === 'LOGIN' && (
            <LoginView 
              onViewRegister={() => setCurrentView('REGISTER')} 
              lang={lang} 
              onChangeLang={handleLanguageChange} 
            />
          )}
          {currentView === 'REGISTER' && (
            <RegisterView 
              onViewLogin={() => setCurrentView('LOGIN')} 
              lang={lang} 
              onChangeLang={handleLanguageChange} 
            />
          )}
          {currentView === 'DASHBOARD' && user && (
            <DashboardRouter 
              user={user} 
              token={token} 
              lang={lang} 
              onChangeLang={handleLanguageChange}
              onLogout={logout}
              onRedirectRegister={() => {
                logout()
                setCurrentView('REGISTER')
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

// Navbar component
function Navbar({ user, onLogout, lang, onChangeLang }: { user: User; onLogout: () => void; lang: Language; onChangeLang: (lang: Language) => void }) {
  const t = translations[lang]
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          {user.role === 'ADMIN' 
            ? t.adminPanelTitle 
            : user.role === 'SUPER_ADMIN' 
            ? t.superAdminPortalTitle 
            : t.studentPortalTitle
          }
        </div>
        <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="text-sm font-sans hide-mobile" style={{ opacity: 0.8 }}>
            {t.signedInAs}: <strong>{user.name || user.email || user.mobile}</strong> ({user.role.replace('_', ' ')})
          </span>
          
          <LanguageSelector lang={lang} onChangeLang={onChangeLang} isDark={true} />

          <button onClick={onLogout} className="navbar-link btn-text flex" style={{ color: '#ffffff', gap: '0.4rem', padding: '0.25rem 0.5rem' }}>
            <LogOut size={16} /> <span className="hide-mobile">{t.logout}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

function PendingApprovalView({ user, token, lang, onLogout, onApproved, onRedirectRegister }: { user: User; token: string | null; lang: Language; onLogout: () => void; onApproved: () => void; onRedirectRegister: () => void }) {
  const t = translations[lang]
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckStatus = async () => {
    setChecking(true)
    setError(null)
    try {
      const res = await fetch('/api/student/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        if (data.rejected) {
          alert(lang === 'hi' ? 'आपका पंजीकरण अस्वीकार कर दिया गया है।' : 'Your registration has been rejected by the admin.')
          onRedirectRegister()
        } else if (data.approved) {
          onApproved()
        } else {
          alert(lang === 'hi' ? 'आपका पंजीकरण अभी भी मंजूरी के लिए लंबित है।' : 'Your registration is still pending admin approval.')
        }
      } else {
        setError(data.error || 'Failed to check status.')
      }
    } catch (err) {
      setError('Connection failed.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-muted)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff9800'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '32px', height: '32px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-navy)' }}>
          {lang === 'hi' ? 'पंजीकरण लंबित है' : 'Registration Pending Approval'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
          {t.pendingApprovalMsg}
        </p>

        <div style={{
          backgroundColor: 'var(--bg-muted, #f8f9fa)',
          border: '1px solid var(--border-muted)',
          borderRadius: '6px',
          padding: '1rem',
          textAlign: 'left',
          marginBottom: '2rem',
          fontSize: '0.9rem'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>{t.fullName}:</strong> {user.name}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>{t.mobileUnique.split(' (')[0]}:</strong> {user.mobile}
          </div>
          {user.school && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>{t.schoolBadge}:</strong> {user.school.name}
            </div>
          )}
          {user.classroom && (
            <div>
              <strong>{t.classClassroom.split(' / ')[0]}:</strong> {user.classroom.name}
            </div>
          )}
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#ff4d4f' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="btn btn-primary w-full"
            style={{ width: '100%' }}
          >
            {checking ? t.checkingStatusBtn : t.checkStatusBtn}
          </button>

          <button
            onClick={onLogout}
            className="btn btn-secondary w-full"
            style={{ width: '100%' }}
          >
            {t.logout}
          </button>
        </div>
      </div>
    </div>
  )
}

// Dashboard router based on user role
function DashboardRouter({ user, token, lang, onChangeLang, onLogout, onRedirectRegister }: { user: User; token: string | null; lang: Language; onChangeLang: (lang: Language) => void; onLogout: () => void; onRedirectRegister: () => void }) {
  const { login } = useAuth()
  if (user.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard token={token} lang={lang} />
  }
  if (user.role === 'ADMIN') {
    return <AdminDashboard token={token} lang={lang} />
  }
  if (user.role === 'STUDENT' && user.approved === false) {
    const handleApproved = () => {
      if (token) {
        login(token, { ...user, approved: true })
      }
    }
    return <PendingApprovalView user={user} token={token} lang={lang} onLogout={onLogout} onApproved={handleApproved} onRedirectRegister={onRedirectRegister} />
  }
  return <StudentDashboard token={token} user={user} lang={lang} onChangeLang={onChangeLang} onLogout={onLogout} />
}
export default App;
