import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth, User } from './context/AuthContext'
import { translations, Language } from './utils/localization'
import { LogOut } from 'lucide-react'
import { LoginView, RegisterView } from './components/AuthViews'
import { StandaloneSchoolDetailView, SuperAdminDashboard, AdminDashboard } from './components/AdminViews'
import { StudentDashboard } from './components/StudentViews'

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
    if (user && token) {
      // Update local auth context immediately to avoid needing system refresh!
      let updatedUser = { ...user, language: newLang }
      login(token, updatedUser)

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
          if (data.success && data.school && data.classroom) {
            updatedUser = {
              ...updatedUser,
              school: data.school,
              classroom: data.classroom
            }
            login(token, updatedUser)
          }
        } catch (err) {
          console.error('Failed to save language preference on backend:', err)
        }
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

  return (
    <div>
      {user && <Navbar user={user} onLogout={logout} lang={lang} onChangeLang={handleLanguageChange} />}
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
              onLogout={logout}
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
          
          <select 
            value={lang} 
            onChange={(e) => onChangeLang(e.target.value as Language)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              outline: 'none',
              width: '70px'
            }}
          >
            <option value="en" style={{ color: '#333333' }}>EN</option>
            <option value="hi" style={{ color: '#333333' }}>HI</option>
          </select>

          <button onClick={onLogout} className="navbar-link btn-text flex" style={{ color: '#ffffff', gap: '0.4rem', padding: '0.25rem 0.5rem' }}>
            <LogOut size={16} /> <span className="hide-mobile">{t.logout}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

function PendingApprovalView({ user, token, lang, onLogout, onApproved }: { user: User; token: string | null; lang: Language; onLogout: () => void; onApproved: () => void }) {
  const t = translations[lang]

  useEffect(() => {
    let active = true
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/student/status', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (active && data.success && data.approved) {
          onApproved()
        }
      } catch (err) {
        console.error('Error checking approval status:', err)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [token, onApproved])

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

        <button
          onClick={onLogout}
          className="btn btn-secondary w-full"
          style={{ width: '100%' }}
        >
          {t.logout}
        </button>
      </div>
    </div>
  )
}

// Dashboard router based on user role
function DashboardRouter({ user, token, lang, onLogout }: { user: User; token: string | null; lang: Language; onLogout: () => void }) {
  const { login } = useAuth()
  if (user.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard token={token} />
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
    return <PendingApprovalView user={user} token={token} lang={lang} onLogout={onLogout} onApproved={handleApproved} />
  }
  return <StudentDashboard token={token} user={user} lang={lang} />
}
export default App;
