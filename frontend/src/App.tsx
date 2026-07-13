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

// Dashboard router based on user role
function DashboardRouter({ user, token, lang }: { user: User; token: string | null; lang: Language }) {
  if (user.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard token={token} />
  }
  if (user.role === 'ADMIN') {
    return <AdminDashboard token={token} lang={lang} />
  }
  return <StudentDashboard token={token} user={user} lang={lang} />
}
export default App;
