import React, { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useAuth, User } from '../context/AuthContext'
import { generateCertificatePDF } from '../utils/pdfGenerator'
import { translations, Language } from '../utils/localization'
import { renderContent } from '../utils/contentRenderer'
import { 
  LogOut, Shield, Award, Users, School as SchoolIcon, 
  CheckCircle, Clock, Award as TrophyIcon, 
  ChevronRight, ChevronLeft, Search,
  BookOpen, FileText, TrendingUp, BarChart2, PieChart
} from 'lucide-react'

// Natural sort comparator for items with a 'name' field (e.g. Class 1, Class 2, ..., Class 10)
const naturalSortByName = (a: any, b: any) => {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
}

// Reusable School Detail Panel containing Registered Students, Attempts, and Live Rankings
function SchoolDetailPanel({ 
  schoolDetail, 
  onBack, 
  onCloseTab,
  token,
  lang = 'en'
}: { 
  schoolDetail: any; 
  onBack: () => void; 
  onCloseTab?: () => void; 
  token: string | null;
  lang?: Language;
}) {
  const [tab, setTab] = useState<'STUDENTS' | 'ATTEMPTS' | 'RANKINGS'>('STUDENTS')

  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [groups, setGroups] = useState<any[]>([])
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')

  // Linked classrooms management states
  const [currentClassrooms, setCurrentClassrooms] = useState<any[]>(schoolDetail.school.classrooms || [])
  const [allClassrooms, setAllClassrooms] = useState<any[]>([])
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([])
  const [showManageClassesModal, setShowManageClassesModal] = useState(false)
  const [savingClasses, setSavingClasses] = useState(false)

  useEffect(() => {
    setCurrentClassrooms([...(schoolDetail.school.classrooms || [])].sort(naturalSortByName))
  }, [schoolDetail.school.classrooms])

  const classroomsList = React.useMemo(() => {
    const list: Record<string, string> = {}
    ;(schoolDetail.students || []).forEach((s: any) => {
      if (s.classroomId && s.classroomName) {
        list[s.classroomId] = s.classroomName
      }
    })
    ;(schoolDetail.attempts || []).forEach((att: any) => {
      if (att.classroomId && att.classroomName) {
        list[att.classroomId] = att.classroomName
      }
    })
    return Object.entries(list).map(([id, name]) => ({ id, name })).sort(naturalSortByName)
  }, [schoolDetail])

  const examsList = React.useMemo(() => {
    const list: Record<string, string> = {}
    ;(schoolDetail.attempts || []).forEach((att: any) => {
      if (att.examId && att.examName) {
        list[att.examId] = att.examName
      }
    })
    return Object.entries(list).map(([id, name]) => ({ id, name }))
  }, [schoolDetail])

  // Fetch groups and classrooms lists on mount / language change
  useEffect(() => {
    const fetchGroupsAndClassrooms = async () => {
      if (!token) return
      try {
        const resG = await fetch(`/api/admin/groups?language=${lang}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const dG = await resG.json()
        if (dG.success) {
          setGroups(dG.groups)
        }

        const resC = await fetch(`/api/admin/classrooms?language=${lang}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const dC = await resC.json()
        if (dC.success) {
          setAllClassrooms([...dC.classrooms].sort(naturalSortByName))
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchGroupsAndClassrooms()
  }, [token, lang])

  // Calculate live rankings from completed attempts with dynamic filters
  const rankedAttempts = React.useMemo(() => {
    let completed = (schoolDetail.attempts || []).filter((att: any) => att.completed)

    if (selectedClassroomId) {
      completed = completed.filter((att: any) => att.classroomId === selectedClassroomId)
    }

    if (selectedExamId) {
      completed = completed.filter((att: any) => att.examId === selectedExamId)
    }

    if (selectedGroupId) {
      const groupObj = groups.find(g => g.id === selectedGroupId)
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

    completed = [...completed].sort((a: any, b: any) => b.score - a.score)

    let currentRank = 0
    let lastScore = -1
    return completed.map((att: any, index: number) => {
      if (att.score !== lastScore) {
        currentRank = index + 1
        lastScore = att.score
      }
      return { ...att, rank: currentRank }
    })
  }, [schoolDetail.attempts, selectedClassroomId, selectedExamId, selectedGroupId, groups, startDate, startTime, endDate, endTime])

  const handleSaveClasses = async () => {
    setSavingClasses(true)
    try {
      const res = await fetch('/api/admin/schools', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: schoolDetail.school.id,
          name: schoolDetail.school.name,
          udise: schoolDetail.school.udise,
          tehsil: schoolDetail.school.tehsil,
          district: schoolDetail.school.district,
          classroomIds: selectedClassroomIds
        })
      })
      const data = await res.json()
      if (data.success) {
        const updated = allClassrooms.filter(c => selectedClassroomIds.includes(c.id)).sort(naturalSortByName)
        setCurrentClassrooms(updated)
        setShowManageClassesModal(false)
      } else {
        alert(data.error || 'Failed to update classes.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error while updating classes.')
    } finally {
      setSavingClasses(false)
    }
  }

  return (
    <div className="card" style={{ height: 'fit-content' }}>
      <div className="flex-between" style={{ borderBottom: '1px solid var(--border-muted)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            onClick={onBack}
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.85rem', textTransform: 'none', marginBottom: '0.75rem' }}
          >
            ← Back
          </button>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '0.25rem', color: 'var(--primary-navy)' }}>
            {schoolDetail.school.name}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
            <span className="badge badge-outline" style={{ fontSize: '0.8rem', textTransform: 'none' }}>
              UDISE: {schoolDetail.school.udise}
            </span>
            {schoolDetail.school.tehsil && (
              <span className="badge badge-outline" style={{ fontSize: '0.8rem', textTransform: 'none' }}>
                Tehsil: {schoolDetail.school.tehsil}
              </span>
            )}
            {schoolDetail.school.district && (
              <span className="badge badge-outline" style={{ fontSize: '0.8rem', textTransform: 'none' }}>
                District: {schoolDetail.school.district}
              </span>
            )}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              Admin: {schoolDetail.school.adminEmail} (Mob: {schoolDetail.school.adminMobile})
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Linked Classes:</span>
            {currentClassrooms.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No classes linked</span>
            ) : (
              currentClassrooms.map((c: any) => (
                <span key={c.id} className="badge badge-outline" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderColor: 'var(--primary-navy)', color: 'var(--primary-navy)' }}>
                  {c.name}
                </span>
              ))
            )}
            {token && (
              <button
                onClick={() => {
                  setSelectedClassroomIds(currentClassrooms.map((c: any) => c.id))
                  setShowManageClassesModal(true)
                }}
                className="btn btn-secondary"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  marginLeft: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  textTransform: 'none',
                  height: 'auto',
                  lineHeight: '1'
                }}
              >
                ✏️ Manage Classes
              </button>
            )}
          </div>
        </div>
        {onCloseTab && (
          <button 
            onClick={onCloseTab} 
            className="btn btn-primary" 
            style={{ padding: '0.45rem 1rem', textTransform: 'none' }}
          >
            Close Tab
          </button>
        )}
      </div>

      {/* Detail Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-muted)', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
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
          Registered Students ({schoolDetail.students.length})
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
          Exam Attempts & Submissions ({schoolDetail.attempts.length})
        </button>
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
          🏆 Live Rankings ({rankedAttempts.length})
        </button>
      </div>

      {/* Tab content: STUDENTS */}
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
              {schoolDetail.students.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No students registered under this school.
                  </td>
                </tr>
              ) : (
                schoolDetail.students.map((std: any) => (
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

      {/* Tab content: ATTEMPTS */}
      {tab === 'ATTEMPTS' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Exam Name</th>
                <th>Score</th>
                <th>Date Completed</th>
              </tr>
            </thead>
            <tbody>
              {schoolDetail.attempts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No exam attempts recorded under this school yet.
                  </td>
                </tr>
              ) : (
                schoolDetail.attempts.map((att: any) => (
                  <tr key={att.id}>
                    <td><strong>{att.studentName}</strong></td>
                    <td>{att.classroomName}</td>
                    <td>{att.examName}</td>
                    <td>
                      <strong>{att.score} marks</strong>
                    </td>
                    <td>
                      {att.completed ? (
                        <span style={{ fontSize: '0.85rem' }}>
                          {new Date(att.submittedAt).toLocaleString()}
                        </span>
                      ) : (
                        <span className="badge badge-outline">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab content: RANKINGS */}
      {tab === 'RANKINGS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Rankings Filters Row */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            backgroundColor: 'var(--bg-muted, #f8f9fa)', 
            padding: '0.75rem 1rem', 
            borderRadius: '6px', 
            border: '1px solid var(--border-muted)',
            zIndex: 1000,
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Exam:</span>
              <CustomSelectObject
                value={selectedExamId}
                onChange={setSelectedExamId}
                options={examsList}
                placeholder="All Exams"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Group:</span>
              <CustomSelectObject
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                options={groups.map((g: any) => ({ id: g.id, name: g.name }))}
                placeholder="All Groups"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Classroom:</span>
              <CustomSelectObject
                value={selectedClassroomId}
                onChange={setSelectedClassroomId}
                options={classroomsList}
                placeholder="All Classrooms"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>From:</span>
              <input 
                type="date" 
                className="form-input" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                style={{ padding: '0.35rem 0.5rem', margin: 0, fontSize: '0.85rem', width: '130px', height: '32px', boxSizing: 'border-box' }} 
              />
              <input 
                type="time" 
                className="form-input" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                style={{ padding: '0.35rem 0.4rem', margin: 0, fontSize: '0.85rem', width: '80px', height: '32px', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>To:</span>
              <input 
                type="date" 
                className="form-input" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={{ padding: '0.35rem 0.5rem', margin: 0, fontSize: '0.85rem', width: '130px', height: '32px', boxSizing: 'border-box' }} 
              />
              <input 
                type="time" 
                className="form-input" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                style={{ padding: '0.35rem 0.4rem', margin: 0, fontSize: '0.85rem', width: '80px', height: '32px', boxSizing: 'border-box' }} 
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

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Exam Name</th>
                  <th>Score / Marks</th>
                  <th>Submission Date</th>
                </tr>
              </thead>
              <tbody>
                {rankedAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
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

      {showManageClassesModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '450px', width: '90%', padding: '2rem' }}>
            <h3 className="card-title">Manage Linked Classes</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Select which classrooms are linked to <strong>{schoolDetail.school.name}</strong>.
            </p>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              border: '1px solid var(--border-muted)', 
              borderRadius: '4px', 
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              background: 'var(--card-bg, #ffffff)',
              marginBottom: '1.5rem'
            }}>
              {allClassrooms.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No classrooms created yet.</span>
              ) : (
                allClassrooms.map((cls) => {
                  const isChecked = selectedClassroomIds.includes(cls.id)
                  return (
                    <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedClassroomIds(prev =>
                            prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id]
                          )
                        }}
                      />
                      <span>{cls.name}</span>
                    </label>
                  )
                })
              )}
            </div>
            <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowManageClassesModal(false)}
                className="btn btn-secondary"
                style={{ textTransform: 'none' }}
                disabled={savingClasses}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClasses}
                className="btn btn-primary"
                style={{ textTransform: 'none' }}
                disabled={savingClasses}
              >
                {savingClasses ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Standalone school details page view for opening in a new tab
export function StandaloneSchoolDetailView({ schoolUdise, token, onBackToDashboard }: { schoolUdise: string; token: string | null; onBackToDashboard: () => void }) {
  const [schoolDetail, setSchoolDetail] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/admin/schools/detail?udise=${schoolUdise}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) {
          setSchoolDetail(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (schoolUdise && token) {
      fetchDetail()
    }
  }, [schoolUdise, token])

  if (loading) {
    return (
      <div className="auth-container">
        <div className="font-serif text-lg">Fetching school details...</div>
      </div>
    )
  }

  if (!schoolDetail) {
    return (
      <div className="auth-container">
        <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <h3 className="card-title" style={{ color: '#c00000', border: 'none', marginBottom: '1rem' }}>Failed to Load Details</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Could not find school details or session has expired.</p>
          <button onClick={onBackToDashboard} className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
      <SchoolDetailPanel 
        schoolDetail={schoolDetail} 
        onBack={onBackToDashboard} 
        onCloseTab={() => window.close()} 
        token={token}
      />
      <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem 0', borderTop: '1px solid var(--border-muted)', color: '#888888', fontSize: '0.85rem', width: '100%' }}>
        powered by Neopace Infotech LLP
      </div>
    </div>
  )
}

// Main App wrapper with AuthProvider
export function SuperAdminDashboard({ token }: { token: string | null }) {
  const [stats, setStats] = useState<any>({ totalAdmins: 0, totalSchools: 0, totalStudents: 0, totalAttempts: 0 })
  const [admins, setAdmins] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])
  const [selectedSchoolDetail, setSelectedSchoolDetail] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'ADMINS' | 'SCHOOLS' | 'ATTEMPTS'>('ADMINS')

  // Filters for CSV and overview lists
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('')
  const [attemptSearchQuery, setAttemptSearchQuery] = useState('')
  const [attemptSchoolFilter, setAttemptSchoolFilter] = useState('')
  const [attemptExamFilter, setAttemptExamFilter] = useState('')

  // Form states
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [userCountLimit, setUserCountLimit] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const resStats = await fetch('/api/superadmin/dashboard', { headers })
      const dataStats = await resStats.json()
      if (dataStats.success) {
        setStats(dataStats.stats)
        setSchools(dataStats.schools)
        setRecentAttempts(dataStats.recentAttempts)
      }

      const resAdmins = await fetch('/api/superadmin/admins', { headers })
      const dataAdmins = await resAdmins.json()
      if (dataAdmins.success) {
        setAdmins(dataAdmins.admins)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const downloadExcel = (filename: string, headers: string[], rows: any[][]) => {
    const worksheetData = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
    XLSX.writeFile(workbook, filename)
  }

  const handleExportSchoolsExcel = (list: any[]) => {
    const headers = ['School Name', 'UDISE Number', 'Tehsil', 'District', 'Managed By (Admin)', 'Registered Students']
    const rows = list.map(s => [
      s.name,
      s.udise,
      s.tehsil || '',
      s.district || '',
      s.adminEmail,
      s.studentsCount
    ])
    downloadExcel('schools_overview.xlsx', headers, rows)
  }

  const handleExportAttemptsExcel = (list: any[]) => {
    const headers = ['Student Name', 'School Name', 'Exam Name', 'Score', 'Completion Status', 'Date / Time']
    const rows = list.map(a => [
      a.studentName,
      a.schoolName,
      a.examName,
      a.score,
      a.completed ? 'Completed' : 'In Progress',
      new Date(a.startedAt).toLocaleString()
    ])
    downloadExcel('exam_attempts.xlsx', headers, rows)
  }

  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const escapeField = (field: any) => {
      if (field === null || field === undefined) return ''
      const str = String(field).replace(/"/g, '""')
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`
      }
      return str
    };

    const csvContent = [
      headers.map(escapeField).join(','),
      ...rows.map(row => row.map(escapeField).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportSchools = (list: any[]) => {
    const headers = ['School Name', 'UDISE Number', 'Tehsil', 'District', 'Managed By (Admin)', 'Registered Students']
    const rows = list.map(s => [
      s.name,
      s.udise,
      s.tehsil || '',
      s.district || '',
      s.adminEmail,
      `${s.studentsCount} students`
    ])
    downloadCSV('schools_overview.csv', headers, rows)
  }

  const handleExportAttempts = (list: any[]) => {
    const headers = ['Student Name', 'School Name', 'Exam Name', 'Score', 'Completion Status', 'Date / Time']
    const rows = list.map(a => [
      a.studentName,
      a.schoolName,
      a.examName,
      `${a.score} marks`,
      a.completed ? 'Completed' : 'In Progress',
      new Date(a.startedAt).toLocaleString()
    ])
    downloadCSV('exam_attempts.csv', headers, rows)
  }

  const filteredSchools = schools.filter(s => {
    const query = schoolSearchQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(query) ||
      s.udise.toLowerCase().includes(query) ||
      s.adminEmail.toLowerCase().includes(query)
    )
  })

  const filteredAttempts = recentAttempts.filter(a => {
    const sQuery = attemptSearchQuery.toLowerCase()
    const matchName = a.studentName.toLowerCase().includes(sQuery)
    const matchSchool = !attemptSchoolFilter || a.schoolName === attemptSchoolFilter
    const matchExam = !attemptExamFilter || a.examName === attemptExamFilter
    return matchName && matchSchool && matchExam
  })



  useEffect(() => {
    fetchDashboardData()
  }, [token])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/superadmin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          mobile,
          password,
          userCountLimit: userCountLimit ? parseInt(userCountLimit) : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Admin created successfully!')
        setEmail('')
        setMobile('')
        setPassword('')
        setUserCountLimit('')
        fetchDashboardData()
      } else {
        setError(data.error || 'Failed to create admin.')
      }
    } catch (err) {
      setError('Connection failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!window.confirm('Are you sure you want to delete this Administrator? ALL schools, classrooms, students, exams, question banks, and progress records managed by this admin will be PERMANENTLY DELETED.')) return
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/superadmin/admins?id=${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Administrator and all associated records deleted successfully!')
        fetchDashboardData()
      } else {
        setError(data.error || 'Failed to delete admin.')
      }
    } catch (err) {
      setError('Connection failed.')
    }
  }

  if (selectedSchoolDetail) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <SchoolDetailPanel 
          schoolDetail={selectedSchoolDetail} 
          onBack={() => setSelectedSchoolDetail(null)} 
          token={token}
        />
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header-banner">
        <h1 className="header-banner-title">Super-Admin Console</h1>
        <p className="header-banner-subtitle">
          Manage system administrators, limit allocations, and monitor aggregate schools.
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2.5rem' }}>
        <div 
          onClick={() => setActiveTab('ADMINS')}
          className="card"
          style={{ 
            cursor: 'pointer',
            border: activeTab === 'ADMINS' ? '2px solid var(--accent-gold)' : '1px solid var(--border-muted)',
            boxShadow: activeTab === 'ADMINS' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            transform: activeTab === 'ADMINS' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'ADMINS' ? '#fbf9f5' : '#ffffff'
          }}
        >
          <div className="flex-between">
            <div>
              <div className="form-label" style={{ marginBottom: '0.2rem', color: activeTab === 'ADMINS' ? 'var(--primary-navy)' : 'var(--text-muted)', fontWeight: activeTab === 'ADMINS' ? 'bold' : 'normal' }}>Admins</div>
              <h2 style={{ fontSize: '2.25rem', marginBottom: 0, color: activeTab === 'ADMINS' ? 'var(--primary-navy)' : 'inherit' }}>{stats.totalAdmins}</h2>
            </div>
            <Shield size={36} style={{ color: activeTab === 'ADMINS' ? 'var(--primary-navy)' : 'var(--accent-gold)', opacity: 0.8 }} />
          </div>
        </div>
        <div 
          onClick={() => setActiveTab('SCHOOLS')}
          className="card"
          style={{ 
            cursor: 'pointer',
            border: activeTab === 'SCHOOLS' ? '2px solid var(--accent-gold)' : '1px solid var(--border-muted)',
            boxShadow: activeTab === 'SCHOOLS' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            transform: activeTab === 'SCHOOLS' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'SCHOOLS' ? '#fbf9f5' : '#ffffff'
          }}
        >
          <div className="flex-between">
            <div>
              <div className="form-label" style={{ marginBottom: '0.2rem', color: activeTab === 'SCHOOLS' ? 'var(--primary-navy)' : 'var(--text-muted)', fontWeight: activeTab === 'SCHOOLS' ? 'bold' : 'normal' }}>Schools</div>
              <h2 style={{ fontSize: '2.25rem', marginBottom: 0, color: activeTab === 'SCHOOLS' ? 'var(--primary-navy)' : 'inherit' }}>{stats.totalSchools}</h2>
            </div>
            <SchoolIcon size={36} style={{ color: activeTab === 'SCHOOLS' ? 'var(--primary-navy)' : 'var(--accent-gold)', opacity: 0.8 }} />
          </div>
        </div>
        <div 
          onClick={() => setActiveTab('ATTEMPTS')}
          className="card"
          style={{ 
            cursor: 'pointer',
            border: activeTab === 'ATTEMPTS' ? '2px solid var(--accent-gold)' : '1px solid var(--border-muted)',
            boxShadow: activeTab === 'ATTEMPTS' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            transform: activeTab === 'ATTEMPTS' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'ATTEMPTS' ? '#fbf9f5' : '#ffffff'
          }}
        >
          <div className="flex-between">
            <div>
              <div className="form-label" style={{ marginBottom: '0.2rem', color: activeTab === 'ATTEMPTS' ? 'var(--primary-navy)' : 'var(--text-muted)', fontWeight: activeTab === 'ATTEMPTS' ? 'bold' : 'normal' }}>Students</div>
              <h2 style={{ fontSize: '2.25rem', marginBottom: 0, color: activeTab === 'ATTEMPTS' ? 'var(--primary-navy)' : 'inherit' }}>{stats.totalStudents}</h2>
            </div>
            <Users size={36} style={{ color: activeTab === 'ATTEMPTS' ? 'var(--primary-navy)' : 'var(--accent-gold)', opacity: 0.8 }} />
          </div>
        </div>
        <div 
          onClick={() => setActiveTab('ATTEMPTS')}
          className="card"
          style={{ 
            cursor: 'pointer',
            border: activeTab === 'ATTEMPTS' ? '2px solid var(--accent-gold)' : '1px solid var(--border-muted)',
            boxShadow: activeTab === 'ATTEMPTS' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            transform: activeTab === 'ATTEMPTS' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'ATTEMPTS' ? '#fbf9f5' : '#ffffff'
          }}
        >
          <div className="flex-between">
            <div>
              <div className="form-label" style={{ marginBottom: '0.2rem', color: activeTab === 'ATTEMPTS' ? 'var(--primary-navy)' : 'var(--text-muted)', fontWeight: activeTab === 'ATTEMPTS' ? 'bold' : 'normal' }}>Attempts</div>
              <h2 style={{ fontSize: '2.25rem', marginBottom: 0, color: activeTab === 'ATTEMPTS' ? 'var(--primary-navy)' : 'inherit' }}>{stats.totalAttempts}</h2>
            </div>
            <Award size={36} style={{ color: activeTab === 'ATTEMPTS' ? 'var(--primary-navy)' : 'var(--accent-gold)', opacity: 0.8 }} />
          </div>
        </div>
      </div>

      {activeTab === 'ADMINS' && (
        <div className="grid-2">
          {/* Create Admin Form */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="card-title">Provision New Administrator</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleCreateAdmin}>
              <div className="form-group">
                <label className="form-label">Email ID</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Attempt / User Count (Optional)</label>
                <input
                  type="number"
                  className="form-input"
                  value={userCountLimit}
                  onChange={(e) => setUserCountLimit(e.target.value)}
                  placeholder="e.g. 20000 (leave blank for unlimited)"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Maximum number of attempts allowed for this admin's schools.
                </span>
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Creating Admin...' : 'Create Admin'}
              </button>
            </form>
          </div>

          {/* Admins List */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="card-title">System Administrators</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Admin Detail</th>
                    <th>Limit Allocation</th>
                    <th>Registered Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No administrators found.</td>
                    </tr>
                  ) : (
                    admins.map((adm) => (
                      <tr key={adm.id}>
                        <td>
                          <strong>{adm.email}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mob: {adm.mobile}</div>
                        </td>
                        <td>
                          {adm.userCountLimit === null ? (
                            <span className="badge badge-outline">Unlimited</span>
                          ) : (
                            <span>
                              <strong>{adm.userCountUsed}</strong> / {adm.userCountLimit} used
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{new Date(adm.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteAdmin(adm.id)}
                            className="btn"
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SCHOOLS' && (
        <div className="card" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', flexWrap: 'nowrap' }}>
            <h3 className="card-title" style={{ border: 'none', margin: 0, padding: 0, whiteSpace: 'nowrap' }}>Schools Database Overview</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'nowrap', flexGrow: 1, justifyContent: 'flex-end' }}>
              <input
                type="text"
                className="form-input"
                style={{ maxWidth: '320px', width: '100%', margin: 0, padding: '0.5rem' }}
                placeholder="Search by school, UDISE, or Admin email..."
                value={schoolSearchQuery}
                onChange={(e) => setSchoolSearchQuery(e.target.value)}
              />
              <button
                onClick={() => handleExportSchools(filteredSchools)}
                className="btn btn-secondary"
                style={{ textTransform: 'none', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExportSchoolsExcel(filteredSchools)}
                className="btn btn-primary"
                style={{ textTransform: 'none', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
              >
                Export Excel
              </button>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>UDISE Number</th>
                  <th>Tehsil</th>
                  <th>District</th>
                  <th>Linked Classes</th>
                  <th>Managed By</th>
                  <th>Registered Students</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No matching schools found.</td>
                  </tr>
                ) : (
                  filteredSchools.map((sch) => (
                    <tr key={sch.id}>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => window.open(`/?schoolDetailUdise=${sch.udise}`, '_blank')}
                            className="btn-text"
                            style={{ padding: 0, textDecoration: 'underline', fontWeight: 'bold', color: 'var(--primary-navy)', fontFamily: 'var(--font-sans)', textTransform: 'none', textAlign: 'left' }}
                          >
                            {sch.name}
                          </button>
                          <span className="badge badge-outline" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
                            {sch.language?.toUpperCase() || 'EN'}
                          </span>
                        </div>
                      </td>
                      <td>{sch.udise}</td>
                      <td>{sch.tehsil || '-'}</td>
                      <td>{sch.district || '-'}</td>
                      <td>
                        {sch.classrooms && sch.classrooms.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {sch.classrooms.map((c: any) => (
                              <span key={c.id} className="badge badge-outline" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', textTransform: 'none' }}>
                                {c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>{sch.adminEmail}</td>
                      <td>{sch.studentsCount} students</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ATTEMPTS' && (
        <div className="card" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="card-title" style={{ border: 'none', margin: 0, padding: 0 }}>Recent Exam Attempts</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleExportAttempts(filteredAttempts)}
                  className="btn btn-secondary"
                  style={{ textTransform: 'none', padding: '0.5rem 1rem' }}
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExportAttemptsExcel(filteredAttempts)}
                  className="btn btn-primary"
                  style={{ textTransform: 'none', padding: '0.5rem 1rem' }}
                >
                  Export Excel
                </button>
              </div>
            </div>
            
            {/* Filter controls row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', backgroundColor: '#fcfaf7', padding: '0.75rem', border: '1px solid var(--border-muted)', borderRadius: '2px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>Student Name</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ margin: 0, padding: '0.4rem', fontSize: '0.85rem' }}
                  placeholder="Filter student..."
                  value={attemptSearchQuery}
                  onChange={(e) => setAttemptSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>School Name</label>
                <select
                  value={attemptSchoolFilter}
                  onChange={(e) => setAttemptSchoolFilter(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                >
                  <option value="">-- All Schools --</option>
                  {Array.from(new Set(recentAttempts.map(a => a.schoolName))).map(schoolName => (
                    <option key={schoolName} value={schoolName}>{schoolName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>Exam Name</label>
                <select
                  value={attemptExamFilter}
                  onChange={(e) => setAttemptExamFilter(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                >
                  <option value="">-- All Exams --</option>
                  {Array.from(new Set(recentAttempts.map(a => a.examName))).map(examName => (
                    <option key={examName} value={examName}>{examName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>School Name</th>
                  <th>Exam Name</th>
                  <th>Score</th>
                  <th>Completion Status</th>
                  <th>Date / Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No matching exam attempts found.</td>
                  </tr>
                ) : (
                  filteredAttempts.map((att) => (
                    <tr key={att.id}>
                      <td><strong>{att.studentName}</strong></td>
                      <td>{att.schoolName}</td>
                      <td>{att.examName}</td>
                      <td>{att.score} marks</td>
                      <td>
                        {att.completed ? (
                          <span className="badge badge-success">Completed</span>
                        ) : (
                          <span className="badge badge-outline">In Progress</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(att.startedAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}




      <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem 0', borderTop: '1px solid var(--border-muted)', color: '#888888', fontSize: '0.85rem', width: '100%' }}>
        powered by Neopace Infotech LLP
      </div>
    </div>
  )
}

/* ==========================================
   VIEW: ADMIN DASHBOARD
   ========================================== */
interface SelectOption {
  id: string
  name: string
}

function CustomSelectObject({ 
  value, 
  onChange, 
  options, 
  placeholder,
  maxWidth = '180px'
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: SelectOption[]; 
  placeholder: string;
  maxWidth?: string;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedName = React.useMemo(() => {
    const matched = options.find(opt => opt.id === value)
    return matched ? matched.name : ''
  }, [options, value])

  const [inputValue, setInputValue] = useState(selectedName)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    setInputValue(selectedName)
  }, [selectedName])

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
        setInputValue(selectedName)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [selectedName])

  const filteredOptions = React.useMemo(() => {
    if (!inputValue || inputValue === selectedName) return options
    return options.filter(opt => opt.name.toLowerCase().includes(inputValue.toLowerCase()))
  }, [options, inputValue, selectedName])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth }}>
      <div style={{ position: 'relative' }}>
        <input 
          type="text"
          className="form-input"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
            if (e.target.value === '') {
              onChange('')
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            margin: 0,
            padding: '0.35rem 2rem 0.35rem 0.75rem',
            borderRadius: '4px',
            border: '1px solid var(--border-muted)',
            background: 'var(--card-bg, #ffffff)',
            color: 'var(--text-main, #333)',
            fontSize: '0.85rem'
          }}
        />
        <span 
          style={{ 
            position: 'absolute', 
            right: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            opacity: 0.5, 
            fontSize: '0.65rem', 
            pointerEvents: 'none' 
          }}
        >
          🔍
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          width: '100%',
          maxHeight: '145px',
          overflowY: 'auto',
          background: '#ffffff',
          border: '1px solid var(--border-muted)',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1010
        }}>
          <div
            onClick={() => { onChange(''); setInputValue(''); setIsOpen(false); }}
            onMouseEnter={() => setHoveredIdx(-1)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: hoveredIdx === -1 ? '#fbf9f5' : 'transparent',
              color: hoveredIdx === -1 ? 'var(--primary-navy)' : 'inherit',
              fontWeight: value === '' ? 'bold' : 'normal'
            }}
          >
            Clear Selection
          </div>
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No matches found
            </div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <div
                key={opt.id}
                onClick={() => { onChange(opt.id); setInputValue(opt.name); setIsOpen(false); }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: hoveredIdx === idx ? '#fbf9f5' : 'transparent',
                  color: hoveredIdx === idx ? 'var(--primary-navy)' : 'inherit',
                  fontWeight: value === opt.id ? 'bold' : 'normal'
                }}
              >
                {opt.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Admin Panel Analytics Dashboard Component
function AdminAnalyticsTab({ token, lang }: { token: string | null; lang: Language }) {
  const t = translations[lang]
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters State
  const [schoolId, setSchoolId] = useState('')
  const [classroomId, setClassroomId] = useState('')

  // Top-3 Leaderboard states
  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [leaderboardResults, setLeaderboardResults] = useState<any[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      let url = '/api/admin/analytics'
      const params = new URLSearchParams()
      if (schoolId) params.append('schoolId', schoolId)
      if (classroomId) params.append('classroomId', classroomId)
      params.append('language', lang)
      
      const query = params.toString()
      if (query) url += `?${query}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const resData = await res.json()
      if (resData.success) {
        setData(resData)
      } else {
        setError(resData.error || 'Failed to load analytics data.')
      }
    } catch (err) {
      setError('Connection failed.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch exams list for leaderboard dropdown on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch('/api/admin/exams', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const d = await res.json()
        if (d.success) {
          setExams(d.exams)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchExams()
  }, [token])

  // Fetch groups list on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/admin/groups', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const d = await res.json()
        if (d.success) {
          setGroups(d.groups)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchGroups()
  }, [token])

  // Fetch analytics metrics
  useEffect(() => {
    fetchAnalytics()
  }, [token, schoolId, classroomId, lang])

  // Reset selected exam when language context changes
  useEffect(() => {
    setSelectedExamId('')
  }, [lang])

  // Fetch leaderboard results when filters change
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedExamId) {
        setLeaderboardResults([])
        return
      }
      setLeaderboardLoading(true)

      let startIso = ''
      if (startDate) {
        startIso = startTime ? `${startDate}T${startTime}:00` : `${startDate}T00:00:00`
      }
      let endIso = ''
      if (endDate) {
        endIso = endTime ? `${endDate}T${endTime}:00` : `${endDate}T23:59:59`
      }

      try {
        let query = `/api/admin/results?examId=${selectedExamId}`
        if (schoolId) query += `&schoolId=${schoolId}`
        if (classroomId) query += `&classroomId=${classroomId}`
        if (selectedGroupId) query += `&groupId=${selectedGroupId}`
        if (startIso) query += `&startDate=${encodeURIComponent(startIso)}`
        if (endIso) query += `&endDate=${encodeURIComponent(endIso)}`

        const res = await fetch(query, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const d = await res.json()
        if (d.success) {
          setLeaderboardResults(d.results)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLeaderboardLoading(false)
      }
    }
    fetchLeaderboard()
  }, [selectedExamId, schoolId, classroomId, selectedGroupId, startDate, startTime, endDate, endTime, token])

  const handleSchoolChange = (val: string) => {
    setSchoolId(val)
    setClassroomId('')
  }

  const handleDownloadCSV = () => {
    if (leaderboardResults.length === 0) return

    const headers = [
      'Rank', 'Student Name', 'Mobile', 'School Name', 'UDISE', 'Class Name', 
      'District', 'Tehsil', 'Score', 'Correct Answers', 'Total Questions', 
      'Duration (Minutes)', 'Completion Date'
    ]

    const rows = leaderboardResults.map((r) => [
      r.rank, r.studentName, r.studentMobile, r.schoolName, r.udise, r.classroomName,
      r.district, r.tehsil, r.score, r.correctAnswers, r.totalQuestions,
      r.durationMinutes, new Date(r.submittedAt).toLocaleDateString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    
    const examObj = exams.find((e) => e.id === selectedExamId)
    const examLabel = examObj ? examObj.name.replace(/\s+/g, '_') : 'Exam'
    link.setAttribute('download', `${examLabel}_Top3_Leaderboard.csv`)
    
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && !data) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t.analyticsLoading}</div>
  }

  if (error && !data) {
    return <div className="alert alert-danger">{error}</div>
  }

  if (!data) return null

  const { stats, registrationTrend, examPerformance, scoreDistribution, classroomPerformance, filterOptions } = data

  const kpis = [
    { title: t.analyticsTotalSchools, value: stats.schools, icon: <SchoolIcon size={24} />, color: 'var(--primary-navy)' },
    { title: t.analyticsTotalClassrooms, value: stats.classrooms, icon: <BookOpen size={24} />, color: 'var(--accent-gold)' },
    { title: t.analyticsTotalExams, value: stats.exams, icon: <FileText size={24} />, color: '#2ecc71' },
    { title: t.analyticsTotalAttempts, value: stats.attempts, icon: <Award size={24} />, color: '#9b59b6' },
    { title: t.analyticsAverageScore, value: `${stats.avgScore}%`, icon: <TrendingUp size={24} />, color: '#e67e22' },
  ]

  const renderLineChart = () => {
    if (!registrationTrend || registrationTrend.length === 0) {
      return <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.analyticsNoRegData}</div>
    }
    const width = 500
    const height = 200
    const padding = 30
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const maxCount = Math.max(...registrationTrend.map((d: any) => d.count), 5)
    
    const points = registrationTrend.map((d: any, i: number) => {
      const x = padding + (i / (registrationTrend.length - 1 || 1)) * chartWidth
      const y = padding + chartHeight - (d.count / maxCount) * chartHeight
      return { x, y, label: d.date, value: d.count }
    })

    const pathD = points.reduce((acc: string, p: any, i: number) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
    }, '')

    const fillD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
      : ''

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-navy)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary-navy)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + ratio * chartHeight
          const val = Math.round(maxCount * (1 - ratio))
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border-muted)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding - 5} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{val}</text>
            </g>
          )
        })}
        {fillD && <path d={fillD} fill="url(#lineGrad)" />}
        {pathD && <path d={pathD} fill="none" stroke="var(--primary-navy)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((p: any, i: number) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--accent-gold)" stroke="var(--primary-navy)" strokeWidth="2" />
            <text x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{p.label}</text>
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--primary-navy)">{p.value}</text>
          </g>
        ))}
      </svg>
    )
  }

  const renderBarChart = () => {
    if (!examPerformance || examPerformance.length === 0) {
      return <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>{t.analyticsNoPerfData}</div>
    }
    const width = 500
    const height = 200
    const padding = 30
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const maxScore = Math.max(...examPerformance.map((d: any) => d.avgScore), 10)
    const barWidth = Math.min(30, (chartWidth / examPerformance.length) * 0.6)
    const gap = (chartWidth - barWidth * examPerformance.length) / (examPerformance.length - 1 || 1)

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-gold)" />
            <stop offset="100%" stopColor="#bfa15f" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + ratio * chartHeight
          const val = Math.round(maxScore * (1 - ratio))
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border-muted)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding - 5} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{val}</text>
            </g>
          )
        })}
        {examPerformance.map((d: any, i: number) => {
          const x = padding + i * (barWidth + gap)
          const barHeight = (d.avgScore / maxScore) * chartHeight
          const y = padding + chartHeight - barHeight
          const label = d.name.length > 8 ? d.name.substring(0, 7) + '..' : d.name

          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" ry="3" fill="url(#barGrad)" />
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{label}</text>
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--primary-navy)">{d.avgScore}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  const renderDonutChart = () => {
    const { excellent, good, average, poor } = scoreDistribution
    const total = excellent + good + average + poor
    if (total === 0) return <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.analyticsNoScoreRecords}</div>

    const radius = 50
    const strokeWidth = 14
    const circumference = 2 * Math.PI * radius
    
    const segments = [
      { count: excellent, color: '#2ecc71', label: '80%+' },
      { count: good, color: 'var(--accent-gold)', label: '60-79%' },
      { count: average, color: '#3498db', label: '40-59%' },
      { count: poor, color: '#e74c3c', label: '<40%' },
    ].filter(s => s.count > 0)

    let accumulatedPercentage = 0

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--bg-muted, #f4f6f8)" strokeWidth={strokeWidth} />
          {segments.map((seg, idx) => {
            const percentage = (seg.count / total) * 100
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
            const strokeDashoffset = `${-((accumulatedPercentage / 100) * circumference)}`
            accumulatedPercentage += percentage
            
            return (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 60 60)"
                strokeLinecap="round"
              />
            )
          })}
          <text x="60" y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--primary-navy)">{t.analyticsLeaderboardTotal}</text>
          <text x="60" y="74" textAnchor="middle" fontSize="15" fontWeight="bold" fill="var(--text-main, #333)">{total}</text>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
          {segments.map((seg, idx) => {
            const percentage = Math.round((seg.count / total) * 100)
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: seg.color }}></span>
                <span style={{ fontWeight: 'bold' }}>{seg.label}:</span>
                <span>{seg.count} ({percentage}%)</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginTop: '1rem' }}>
      {/* Filter Row */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        backgroundColor: 'var(--bg-muted, #f8f9fa)', 
        padding: '0.75rem 1rem', 
        borderRadius: '6px', 
        border: '1px solid var(--border-muted)',
        zIndex: 1000,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{t.schoolBadge}:</span>
          <CustomSelectObject
            value={schoolId}
            onChange={handleSchoolChange}
            options={filterOptions?.schools || []}
            placeholder={t.analyticsSelectSchool}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{t.classClassroom}:</span>
          <CustomSelectObject
            value={classroomId}
            onChange={setClassroomId}
            options={filterOptions?.classrooms || []}
            placeholder={t.selectClass}
          />
        </div>

        {(schoolId || classroomId) && (
          <button
            onClick={() => { setSchoolId(''); setClassroomId(''); }}
            className="btn btn-secondary"
            style={{ 
              padding: '0.35rem 0.6rem', 
              fontSize: '0.8rem', 
              textTransform: 'none', 
              marginLeft: 'auto' 
            }}
          >
            {t.analyticsClearFilters}
          </button>
        )}
      </div>

      {/* Main dashboard content container (with loading opacity indicator) */}
      <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s ease', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {kpis.map((kpi, idx) => (
            <div key={idx} className="card" style={{ padding: '1rem', border: '1px solid var(--border-muted)', borderRadius: '6px', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '10px', top: '10px', color: kpi.color, opacity: 0.2 }}>{kpi.icon}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.title}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: kpi.color, marginTop: '0.25rem' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: '1.5rem' }}>
          <div className="card" style={{ height: 'fit-content', padding: '1.25rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary-navy)' }} />
              <span>{t.analyticsRegTrends}</span>
            </h3>
            {renderLineChart()}
          </div>

          <div className="card" style={{ height: 'fit-content', padding: '1.25rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart2 size={18} style={{ color: 'var(--accent-gold)' }} />
              <span>{t.analyticsScoreBreakdown}</span>
            </h3>
            {renderBarChart()}
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1.5rem', gridTemplateColumns: '1.2fr 1.8fr' }}>
          <div className="card" style={{ height: 'fit-content', padding: '1.25rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PieChart size={18} style={{ color: '#2ecc71' }} />
              <span>{t.analyticsGradeDistribution}</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '170px' }}>
              {renderDonutChart()}
            </div>
          </div>

          <div className="card" style={{ height: 'fit-content', padding: '1.25rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <SchoolIcon size={18} style={{ color: 'var(--primary-navy)' }} />
              <span>{t.analyticsClassroomPerformance}</span>
            </h3>
            <div className="table-container" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t.analyticsClassroomColName}</th>
                    <th>{t.analyticsClassroomColStudents}</th>
                    <th>{t.analyticsClassroomColAttempts}</th>
                    <th>{t.analyticsClassroomColAvgScore}</th>
                  </tr>
                </thead>
                <tbody>
                  {classroomPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t.analyticsNoClassroomData}</td>
                    </tr>
                  ) : (
                    classroomPerformance.map((cls: any, i: number) => (
                      <tr key={i}>
                        <td><strong>{cls.name}</strong></td>
                        <td>{cls.studentsCount}</td>
                        <td>{cls.attemptsCount}</td>
                        <td>
                          <span className="badge badge-success" style={{ backgroundColor: cls.avgScore > 0 ? 'var(--primary-navy)' : 'transparent', color: cls.avgScore > 0 ? '#ffffff' : 'inherit', border: cls.avgScore > 0 ? 'none' : '1px solid var(--border-muted)' }}>
                            {cls.avgScore} pts
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top-3 Leaderboard integration */}
        <div className="card" style={{ height: 'fit-content', padding: '1.25rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrophyIcon size={18} style={{ color: 'var(--accent-gold)' }} />
            <span>{t.analyticsLeaderboardTitle}</span>
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem', zIndex: 900, position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.analyticsExamNameRequired}</span>
              <CustomSelectObject
                value={selectedExamId}
                onChange={setSelectedExamId}
                options={exams.filter(e => (e.language || 'en') === lang).map(e => ({ id: e.id, name: e.name }))}
                placeholder={t.analyticsSelectExamPlaceholder}
                maxWidth="100%"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.analyticsGroupOptional}</span>
              <CustomSelectObject
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                options={groups.map(g => ({ id: g.id, name: g.name }))}
                placeholder={t.analyticsAllGroupsPlaceholder}
                maxWidth="100%"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.analyticsFromDateTime}</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input 
                  type="date" 
                  className="form-input" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  style={{ padding: '0.4rem 0.5rem', margin: 0, fontSize: '0.85rem', flex: 1, height: '34px', boxSizing: 'border-box' }} 
                />
                <input 
                  type="time" 
                  className="form-input" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  style={{ padding: '0.4rem 0.4rem', margin: 0, fontSize: '0.85rem', width: '90px', height: '34px', boxSizing: 'border-box' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.analyticsToDateTime}</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input 
                  type="date" 
                  className="form-input" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  style={{ padding: '0.4rem 0.5rem', margin: 0, fontSize: '0.85rem', flex: 1, height: '34px', boxSizing: 'border-box' }} 
                />
                <input 
                  type="time" 
                  className="form-input" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  style={{ padding: '0.4rem 0.4rem', margin: 0, fontSize: '0.85rem', width: '90px', height: '34px', boxSizing: 'border-box' }} 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {(selectedExamId || selectedGroupId || startDate || startTime || endDate || endTime) && (
              <button
                onClick={() => {
                  setSelectedExamId('')
                  setSelectedGroupId('')
                  setStartDate('')
                  setStartTime('')
                  setEndDate('')
                  setEndTime('')
                }}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', textTransform: 'none' }}
              >
                {t.analyticsClearLeaderboardFilters}
              </button>
            )}
            {selectedExamId && leaderboardResults.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', textTransform: 'none' }}
              >
                {t.analyticsDownloadCsvReport}
              </button>
            )}
          </div>

          {leaderboardLoading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>{t.analyticsFetchingLeaderboard}</div>
          ) : !selectedExamId ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.analyticsSelectExamToLoad}</div>
          ) : leaderboardResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.analyticsNoStudentCompleted}</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t.analyticsLeaderboardRank}</th>
                    <th>{t.analyticsLeaderboardStudentName}</th>
                    <th>{t.analyticsLeaderboardClass}</th>
                    <th>{t.analyticsLeaderboardSchoolName}</th>
                    <th>{t.analyticsLeaderboardScore}</th>
                    <th>{t.analyticsLeaderboardCertificate}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardResults.map((r: any) => (
                    <tr key={r.rank + r.studentMobile} style={{ backgroundColor: r.rank === 1 ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 'bold',
                            backgroundColor: r.rank === 1 ? '#d4af37' : r.rank === 2 ? '#c0c0c0' : r.rank === 3 ? '#cd7f32' : 'transparent',
                            color: r.rank <= 3 ? '#ffffff' : 'inherit',
                            border: r.rank <= 3 ? 'none' : '1px solid var(--border-muted)',
                          }}
                        >
                          {r.rank === 1 ? '🥇 1st' : r.rank === 2 ? '🥈 2nd' : r.rank === 3 ? '🥉 3rd' : `${r.rank}th`}
                        </span>
                      </td>
                      <td><strong>{r.studentName}</strong></td>
                      <td>{r.classroomName}</td>
                      <td>{r.schoolName}</td>
                      <td>
                        <strong>{r.score} {t.analyticsLeaderboardMarks}</strong> <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({r.correctAnswers}/{r.totalQuestions} Qs)</span>
                      </td>
                      <td>
                        <button
                          onClick={() => generateCertificatePDF({ ...r, language: lang })}
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', textTransform: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          {t.analyticsLeaderboardCertificate}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminDashboard({ token, lang }: { token: string | null; lang: Language }) {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'SCHOOLS' | 'CLASSROOMS' | 'CATEGORIES' | 'EXAMS'>('ANALYTICS')
  const t = translations[lang]

  return (
    <div className="container">
      {/* Admin Tabs */}
      <div className="admin-tabs-container" style={{ display: 'flex', borderBottom: '1px solid var(--border-muted)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className="btn-text"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem',
            padding: '1rem 1.5rem',
            color: activeTab === 'ANALYTICS' ? 'var(--primary-navy)' : 'var(--text-muted)',
            borderBottom: activeTab === 'ANALYTICS' ? '2px solid var(--accent-gold)' : 'none',
          }}
        >
          {t.tabAnalytics}
        </button>
        <button
          onClick={() => setActiveTab('SCHOOLS')}
          className="btn-text"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem',
            padding: '1rem 1.5rem',
            color: activeTab === 'SCHOOLS' ? 'var(--primary-navy)' : 'var(--text-muted)',
            borderBottom: activeTab === 'SCHOOLS' ? '2px solid var(--accent-gold)' : 'none',
          }}
        >
          {t.tabSchools}
        </button>
        <button
          onClick={() => setActiveTab('CLASSROOMS')}
          className="btn-text"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem',
            padding: '1rem 1.5rem',
            color: activeTab === 'CLASSROOMS' ? 'var(--primary-navy)' : 'var(--text-muted)',
            borderBottom: activeTab === 'CLASSROOMS' ? '2px solid var(--accent-gold)' : 'none',
          }}
        >
          {t.tabClassrooms}
        </button>
        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className="btn-text"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem',
            padding: '1rem 1.5rem',
            color: activeTab === 'CATEGORIES' ? 'var(--primary-navy)' : 'var(--text-muted)',
            borderBottom: activeTab === 'CATEGORIES' ? '2px solid var(--accent-gold)' : 'none',
          }}
        >
          {t.tabCategories}
        </button>
        <button
          onClick={() => setActiveTab('EXAMS')}
          className="btn-text"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem',
            padding: '1rem 1.5rem',
            color: activeTab === 'EXAMS' ? 'var(--primary-navy)' : 'var(--text-muted)',
            borderBottom: activeTab === 'EXAMS' ? '2px solid var(--accent-gold)' : 'none',
          }}
        >
          {t.tabExams}
        </button>
      </div>

      {activeTab === 'ANALYTICS' && <AdminAnalyticsTab token={token} lang={lang} />}
      {activeTab === 'SCHOOLS' && <AdminSchoolsTab token={token} lang={lang} />}
      {activeTab === 'CLASSROOMS' && <AdminClassroomsTab token={token} lang={lang} />}
      {activeTab === 'CATEGORIES' && <AdminCategoriesTab token={token} lang={lang} />}
      {activeTab === 'EXAMS' && <AdminExamsTab token={token} lang={lang} />}

      <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem 0', borderTop: '1px solid var(--border-muted)', color: '#888888', fontSize: '0.85rem', width: '100%' }}>
        powered by Neopace Infotech LLP
      </div>
    </div>
  )
}

// Custom Select Component for limited scrolling options
function CustomSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Sync value prop to internal input value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
        // Sync input text back to current value state
        setInputValue(value)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [value])

  // Filter options based on user text typing
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options
    return options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()))
  }, [options, inputValue])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: '180px' }}>
      <div style={{ position: 'relative' }}>
        <input 
          type="text"
          className="form-input"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
            if (e.target.value === '') {
              onChange('')
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            margin: 0,
            padding: '0.45rem 2rem 0.45rem 0.75rem',
            borderRadius: '4px',
            border: '1px solid var(--border-muted)',
            background: 'var(--card-bg, #ffffff)',
            color: 'var(--text-main, #333)',
            fontSize: '0.9rem'
          }}
        />
        <span 
          style={{ 
            position: 'absolute', 
            right: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            opacity: 0.5, 
            fontSize: '0.65rem', 
            pointerEvents: 'none' 
          }}
        >
          🔍
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          width: '100%',
          maxHeight: '145px', // Height for 5 items (approx 29px each)
          overflowY: 'auto',
          background: '#ffffff',
          border: '1px solid var(--border-muted)',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1010
        }}>
          <div
            onClick={() => { onChange(''); setInputValue(''); setIsOpen(false); }}
            onMouseEnter={() => setHoveredIdx(-1)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: hoveredIdx === -1 ? '#fbf9f5' : 'transparent',
              color: hoveredIdx === -1 ? 'var(--primary-navy)' : 'inherit',
              fontWeight: value === '' ? 'bold' : 'normal'
            }}
          >
            Clear Selection
          </div>
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No matches found
            </div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <div
                key={opt}
                onClick={() => { onChange(opt); setInputValue(opt); setIsOpen(false); }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: hoveredIdx === idx ? '#fbf9f5' : 'transparent',
                  color: hoveredIdx === idx ? 'var(--primary-navy)' : 'inherit',
                  fontWeight: value === opt ? 'bold' : 'normal',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Reusable School Selection Field with filters, search, and bulk select
function SchoolSelectorField({ 
  schools, 
  selectedSchoolIds, 
  setSelectedSchoolIds 
}: { 
  schools: any[]; 
  selectedSchoolIds: string[]; 
  setSelectedSchoolIds: React.Dispatch<React.SetStateAction<string[]>>; 
}) {
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [tehsil, setTehsil] = useState('')

  const uniqueDistricts = React.useMemo(() => {
    const set = new Set<string>()
    schools.forEach(s => {
      if (s.district) set.add(s.district.trim())
    })
    return Array.from(set).sort()
  }, [schools])

  const uniqueTehsils = React.useMemo(() => {
    const set = new Set<string>()
    schools.forEach(s => {
      if (s.tehsil) set.add(s.tehsil.trim())
    })
    return Array.from(set).sort()
  }, [schools])

  const filtered = React.useMemo(() => {
    return schools.filter(s => {
      const matchSearch = !search || 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.udise.toLowerCase().includes(search.toLowerCase())
      const matchDistrict = !district || s.district === district
      const matchTehsil = !tehsil || s.tehsil === tehsil
      return matchSearch && matchDistrict && matchTehsil
    })
  }, [schools, search, district, tehsil])

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selectedSchoolIds.includes(s.id))

  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredIds = filtered.map(s => s.id)
      setSelectedSchoolIds(prev => prev.filter(id => !filteredIds.includes(id)))
    } else {
      setSelectedSchoolIds(prev => {
        const next = [...prev]
        filtered.forEach(s => {
          if (!next.includes(s.id)) next.push(s.id)
        })
        return next
      })
    }
  }

  return (
    <div style={{ border: '1px solid var(--border-muted)', borderRadius: '4px', padding: '0.75rem', background: 'var(--card-bg, #ffffff)' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          style={{ flexGrow: 2, minWidth: '150px', margin: 0, padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
          placeholder="Search school name/UDISE..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <CustomSelect
          value={district}
          onChange={(val) => {
            setDistrict(val)
            setTehsil('')
          }}
          options={uniqueDistricts}
          placeholder="All Districts"
        />
        <CustomSelect
          value={tehsil}
          onChange={setTehsil}
          options={uniqueTehsils}
          placeholder="All Tehsils"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.25rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={handleSelectAllFiltered}
            style={{ marginRight: '0.4rem' }}
            disabled={filtered.length === 0}
          />
          Select All (Filtered: {filtered.length})
        </label>
        <span>Selected: {selectedSchoolIds.filter(id => schools.some(s => s.id === id)).length} of {schools.length}</span>
      </div>

      <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
            No matching schools found.
          </div>
        ) : (
          filtered.map((sch) => {
            const isChecked = selectedSchoolIds.includes(sch.id)
            return (
              <label 
                key={sch.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '0.35rem', 
                  cursor: 'pointer', 
                  fontSize: '0.85rem', 
                  padding: '0.2rem 0.4rem', 
                  borderRadius: '3px',
                  background: isChecked ? '#fbf9f5' : 'transparent',
                  transition: 'background 0.1s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    setSelectedSchoolIds(prev =>
                      prev.includes(sch.id) ? prev.filter(id => id !== sch.id) : [...prev, sch.id]
                    )
                  }}
                  style={{ marginRight: '0.5rem' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>{sch.name}</strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    UDISE: {sch.udise} {sch.tehsil && `| Tehsil: ${sch.tehsil}`} {sch.district && `| District: ${sch.district}`}
                  </span>
                </div>
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}

// Sub-Tab 1: Schools Seeding
function AdminSchoolsTab({ token, lang }: { token: string | null; lang: Language }) {
  const t = translations[lang]
  const [csvContent, setCsvContent] = useState('')
  const [schools, setSchools] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedSchoolDetail, setSelectedSchoolDetail] = useState<any | null>(null)

  // Selections and Edit state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingSchool, setEditingSchool] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editUdise, setEditUdise] = useState('')
  const [editTehsil, setEditTehsil] = useState('')
  const [editDistrict, setEditDistrict] = useState('')
  const [allClassrooms, setAllClassrooms] = useState<any[]>([])
  const [editClassroomIds, setEditClassroomIds] = useState<string[]>([])

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTehsil, setSelectedTehsil] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  // Unique tehsils and districts
  const uniqueTehsils = React.useMemo(() => {
    const set = new Set<string>()
    schools.forEach(s => {
      if (s.tehsil) set.add(s.tehsil.trim())
    })
    return Array.from(set).sort()
  }, [schools])

  const uniqueDistricts = React.useMemo(() => {
    const set = new Set<string>()
    schools.forEach(s => {
      if (s.district) set.add(s.district.trim())
    })
    return Array.from(set).sort()
  }, [schools])

  // Filtered Schools calculation
  const filteredSchools = React.useMemo(() => {
    return schools.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.udise.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesTehsil = !selectedTehsil || s.tehsil === selectedTehsil
      const matchesDistrict = !selectedDistrict || s.district === selectedDistrict
      const matchesLang = (s.language || 'en') === lang

      return matchesSearch && matchesTehsil && matchesDistrict && matchesLang
    })
  }, [schools, searchQuery, selectedTehsil, selectedDistrict, lang])

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize, filteredSchools.length, searchQuery, selectedTehsil, selectedDistrict, lang])

  const paginatedSchools = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSchools.slice(start, start + pageSize)
  }, [filteredSchools, currentPage, pageSize])

  const totalPages = Math.ceil(filteredSchools.length / pageSize)

  const visiblePages = React.useMemo(() => {
    const range: number[] = []
    let start = Math.max(1, currentPage - 1)
    let end = Math.min(totalPages, start + 2)

    if (end - start < 2) {
      start = Math.max(1, end - 2)
    }

    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    return range
  }, [currentPage, totalPages])

  const fetchSchools = async () => {
    setSelectedIds([])
    try {
      const res = await fetch(`/api/admin/schools?language=${lang}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setSchools(data.schools)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchClassrooms = async () => {
    try {
      const res = await fetch(`/api/admin/classrooms?language=${lang}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setAllClassrooms([...data.classrooms].sort(naturalSortByName))
      }
    } catch (err) {
      console.error(err)
    }
  }



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const csv = XLSX.utils.sheet_to_csv(worksheet)
          setCsvContent(csv)
        } catch (err) {
          setError('Failed to parse Excel file.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setCsvContent(text)
      }
      reader.readAsText(file)
    }
  }

  useEffect(() => {
    fetchSchools()
    fetchClassrooms()
  }, [token, lang])

  const handleSeed = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!csvContent.trim()) {
      setError('Please enter CSV data.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/schools/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ csvData: csvContent, language: lang }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message)
        setCsvContent('')
        fetchSchools()
      } else {
        setError(data.error || 'Failed to seed schools.')
      }
    } catch (err) {
      setError('Connection error.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSchool) return
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/schools', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingSchool.id,
          name: editName,
          udise: editUdise,
          tehsil: editTehsil,
          district: editDistrict,
          classroomIds: editClassroomIds
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('School updated successfully!')
        setEditingSchool(null)
        fetchSchools()
      } else {
        setError(data.error || 'Failed to update school.')
      }
    } catch (err) {
      setError('Connection failed.')
    }
  }

  const handleDeleteSchool = async (schoolId: string) => {
    if (!window.confirm('Are you sure you want to delete this school? All associated registered students and their exam records will also be permanently deleted.')) return
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/schools?id=${schoolId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('School and all associated student records deleted successfully!')
        fetchSchools()
      } else {
        setError(data.error || 'Failed to delete school.')
      }
    } catch (err) {
      setError('Connection failed.')
    }
  }

  const handleDeleteSelectedSchools = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected schools? All associated registered students and their exam records will also be permanently deleted.`)) return
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/schools?ids=${selectedIds.join(',')}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message)
        setSelectedIds([])
        fetchSchools()
      } else {
        setError(data.error || 'Failed to delete selected schools.')
      }
    } catch (err) {
      setError('Connection failed.')
    }
  }

  if (selectedSchoolDetail) {
    return (
      <SchoolDetailPanel 
        schoolDetail={selectedSchoolDetail} 
        onBack={() => setSelectedSchoolDetail(null)} 
        token={token}
        lang={lang}
      />
    )
  }

  return (
    <div className="grid-2">
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 className="card-title">{t.schoolsSeedDatabase}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          {t.schoolsCsvUploadDesc}
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSeed}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t.schoolsCsvData}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 'normal', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                Upload .csv/.xlsx: <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} style={{ fontSize: '0.75rem', maxWidth: '170px' }} />
              </span>
            </label>
            <textarea
              className="form-input"
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="School Name, UDISE, Tehsil, District&#10;St. Xavier High School, 27240810101, Palghar, Thane&#10;Modern English School, 27240810102, Vashi, Mumbai"
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? t.schoolsSeedingInProgress : t.schoolsSeedBtn}
          </button>
        </form>
      </div>

      <div className="card" style={{ height: 'fit-content' }}>
        <h3 className="card-title">{t.schoolsManagedSchools}</h3>

        {/* Search and Filters Header Strip */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: '280px', width: '100%', margin: 0, padding: '0.45rem', fontSize: '0.9rem' }}
            placeholder={t.schoolsSearchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <CustomSelect
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            options={uniqueDistricts}
            placeholder={t.adminAllDistricts}
          />
          <CustomSelect
            value={selectedTehsil}
            onChange={setSelectedTehsil}
            options={uniqueTehsils}
            placeholder={t.adminAllTehsils}
          />
        </div>

        {/* Pagination Size Selector and Bulk Actions Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <span>{t.schoolsShowLabel}</span>
            <input
              type="number"
              min={1}
              value={pageSize}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setPageSize(isNaN(val) ? 5 : val)
              }}
              style={{
                width: '70px',
                padding: '0.35rem 0.6rem',
                fontSize: '0.85rem',
                borderRadius: '4px',
                border: '1px solid var(--border-muted)',
                background: 'var(--card-bg, #ffffff)',
                color: 'var(--text-main, #333)',
                textAlign: 'center'
              }}
            />
            <span>{t.adminEntriesText}</span>
          </div>

          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleDeleteSelectedSchools}
                className="btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000', textTransform: 'none' }}
              >
                {t.adminDeleteSelected} ({selectedIds.length})
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textTransform: 'none' }}
              >
                {t.adminClearSelection}
              </button>
            </div>
          )}
        </div>

        <div className="table-container" style={{ maxHeight: '310px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={paginatedSchools.length > 0 && paginatedSchools.every(s => selectedIds.includes(s.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newIds = [...selectedIds]
                        paginatedSchools.forEach(s => {
                          if (!newIds.includes(s.id)) newIds.push(s.id)
                        })
                        setSelectedIds(newIds)
                      } else {
                        setSelectedIds(selectedIds.filter(id => !paginatedSchools.some(s => s.id === id)))
                      }
                    }}
                  />
                </th>
                <th style={{ width: '60px' }}>{t.adminSrNo}</th>
                <th>{t.schoolsColName}</th>
                <th>{t.schoolsColUdise}</th>
                <th>{t.schoolsColTehsil}</th>
                <th>{t.schoolsColDistrict}</th>
                <th>{t.schoolsColClassrooms}</th>
                <th style={{ textAlign: 'right' }}>{t.schoolsColActions}</th>
              </tr>
            </thead>
            <tbody>
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t.schoolsNoSchools}</td>
                </tr>
              ) : filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t.adminNoMatchingSchools}</td>
                </tr>
              ) : (
                paginatedSchools.map((sch, index) => {
                  const isChecked = selectedIds.includes(sch.id)
                  const srNo = (currentPage - 1) * pageSize + index + 1
                  return (
                    <tr key={sch.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedIds(prev =>
                              prev.includes(sch.id) ? prev.filter(id => id !== sch.id) : [...prev, sch.id]
                            )
                          }}
                        />
                      </td>
                      <td>{srNo}</td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => window.open(`/?schoolDetailUdise=${sch.udise}`, '_blank')}
                            className="btn-text"
                            style={{ padding: 0, textDecoration: 'underline', fontWeight: 'bold', color: 'var(--primary-navy)', fontFamily: 'var(--font-sans)', textTransform: 'none', textAlign: 'left' }}
                          >
                            {sch.name}
                          </button>
                          <span className="badge badge-outline" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
                            {sch.language?.toUpperCase() || 'EN'}
                          </span>
                        </div>
                      </td>
                      <td>{sch.udise}</td>
                      <td>{sch.tehsil || '-'}</td>
                      <td>{sch.district || '-'}</td>
                      <td>
                        {sch.classrooms && sch.classrooms.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {sch.classrooms.map((c: any) => (
                              <span key={c.id} className="badge badge-outline" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', textTransform: 'none' }}>
                                {c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.adminNoClassesLinked}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setEditingSchool(sch)
                              setEditName(sch.name)
                              setEditUdise(sch.udise)
                              setEditTehsil(sch.tehsil || '')
                              setEditDistrict(sch.district || '')
                              setEditClassroomIds(sch.classrooms ? sch.classrooms.map((c: any) => c.id) : [])
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none' }}
                          >
                            {t.adminEditBtn}
                          </button>
                          <button
                            onClick={() => handleDeleteSchool(sch.id)}
                            className="btn"
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000' }}
                          >
                            {t.adminDeleteBtn}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Controls */}
        {filteredSchools.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {t.adminShowingText} {Math.min(filteredSchools.length, (currentPage - 1) * pageSize + 1)} {t.adminPrevious.toLowerCase() === 'previous' ? 'to' : 'से'} {Math.min(filteredSchools.length, currentPage * pageSize)} {t.adminOfText} {filteredSchools.length} {t.adminSchoolsText}{filteredSchools.length !== schools.length && ` (${t.adminFilteredFromText} ${schools.length} ${t.adminTotalText})`}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', textTransform: 'none' }}
                >
                  {t.adminPrevious}
                </button>
                {visiblePages.map((pageNum) => {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.85rem',
                        textTransform: 'none',
                        backgroundColor: currentPage === pageNum ? 'var(--primary-navy)' : 'transparent',
                        color: currentPage === pageNum ? '#ffffff' : 'var(--primary-navy)',
                        border: currentPage === pageNum ? '1px solid var(--primary-navy)' : '1px solid var(--border-muted)',
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', textTransform: 'none' }}
                >
                  {t.adminNext}
                </button>
              </div>
            )}
          </div>
        )}
      </div>





      {/* Editing School Modal */}
      {editingSchool && (
        <div className="modal-overlay" style={{ zIndex: 1060 }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}>
            <h3 className="card-title">{t.schoolsEditSchoolTitle}</h3>
            <form onSubmit={handleUpdateSchool}>
              <div className="form-group">
                <label className="form-label">{t.schoolsColName}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.schoolsColUdise}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editUdise}
                  onChange={(e) => setEditUdise(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.schoolsColTehsil}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTehsil}
                  onChange={(e) => setEditTehsil(e.target.value)}
                  placeholder={t.adminTehsilPlaceholder}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.schoolsColDistrict}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  placeholder={t.adminDistrictPlaceholder}
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">{t.classroomsLinkLabel}</label>
                <div style={{ 
                  maxHeight: '130px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-muted)', 
                  borderRadius: '4px', 
                  padding: '0.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  background: 'var(--card-bg, #ffffff)'
                }}>
                  {allClassrooms.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.adminNoClassroomsYet}</span>
                  ) : (
                    allClassrooms.map((cls) => {
                      const isChecked = editClassroomIds.includes(cls.id)
                      return (
                        <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setEditClassroomIds(prev =>
                                prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id]
                              )
                            }}
                          />
                          <span>{cls.name}</span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
              <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="btn btn-secondary"
                  style={{ textTransform: 'none' }}
                >
                  {t.schoolsCancelBtn}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ textTransform: 'none' }}
                >
                  {t.schoolsSaveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-Tab 2: Classrooms & Groups
function AdminClassroomsTab({ token, lang }: { token: string | null; lang: Language }) {
  const t = translations[lang]
  const [schools, setSchools] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])

  const filteredSchoolsForClassrooms = React.useMemo(() => {
    return schools.filter(s => (s.language || 'en') === lang)
  }, [schools, lang])

  // Form states - Classroom
  const [classroomName, setClassroomName] = useState('')
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([])
  const [classError, setClassError] = useState('')
  const [classSuccess, setClassSuccess] = useState('')
  const [editingClassroom, setEditingClassroom] = useState<any | null>(null)
  const [editSchoolIds, setEditSchoolIds] = useState<string[]>([])
  const [selectedClassroomsForPush, setSelectedClassroomsForPush] = useState<string[]>([])

  // Editing Classroom Name state
  const [editingClassroomNameObj, setEditingClassroomNameObj] = useState<any | null>(null)
  const [editClassroomName, setEditClassroomName] = useState('')

  // Form states - Group
  const [groupName, setGroupName] = useState('')
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([])
  const [groupError, setGroupError] = useState('')
  const [groupSuccess, setGroupSuccess] = useState('')

  // Selections and Edit state - Group
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [editingGroup, setEditingGroup] = useState<any | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupClassroomIds, setEditGroupClassroomIds] = useState<string[]>([])

  const fetchData = async () => {
    setSelectedGroupIds([])
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const resSchools = await fetch(`/api/admin/schools?language=${lang}`, { headers })
      const dSchools = await resSchools.json()
      if (dSchools.success) setSchools(dSchools.schools)

      const resClassrooms = await fetch(`/api/admin/classrooms?language=${lang}`, { headers })
      const dClassrooms = await resClassrooms.json()
      if (dClassrooms.success) setClassrooms([...dClassrooms.classrooms].sort(naturalSortByName))

      const resGroups = await fetch(`/api/admin/groups?language=${lang}`, { headers })
      const dGroups = await resGroups.json()
      if (dGroups.success) setGroups(dGroups.groups)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token, lang])

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault()
    setClassError('')
    setClassSuccess('')

    if (!classroomName.trim()) return

    try {
      const res = await fetch('/api/admin/classrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: classroomName,
          schoolIds: selectedSchoolIds,
          language: lang,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setClassSuccess(`Classroom '${classroomName}' added successfully!`)
        setClassroomName('')
        setSelectedSchoolIds([])
        fetchData()
      } else {
        setClassError(data.error || 'Failed to create classroom.')
      }
    } catch (err) {
      setClassError('Connection failed.')
    }
  }

  const handleSavePush = async () => {
    if (!editingClassroom) return

    const payload: any = { schoolIds: editSchoolIds, language: lang }
    if (editingClassroom.isBulk) {
      payload.classroomIds = selectedClassroomsForPush
    } else {
      payload.name = editingClassroom.name
    }

    try {
      const res = await fetch('/api/admin/classrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setClassSuccess(`Classrooms pushed successfully!`)
        setEditingClassroom(null)
        setEditSchoolIds([])
        setSelectedClassroomsForPush([])
        fetchData()
      } else {
        setClassError(data.error || 'Failed to update classroom schools.')
      }
    } catch (err) {
      setClassError('Connection failed.')
    }
  }

  const handleUpdateClassroomName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClassroomNameObj) return
    setClassError('')
    setClassSuccess('')

    try {
      const res = await fetch('/api/admin/classrooms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingClassroomNameObj.id,
          name: editClassroomName,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setClassSuccess('Classroom name updated successfully!')
        setEditingClassroomNameObj(null)
        fetchData()
      } else {
        setClassError(data.error || 'Failed to update classroom name.')
      }
    } catch (err) {
      setClassError('Connection failed.')
    }
  }

  const handleDeleteClassroom = async (classId: string) => {
    if (!window.confirm('Are you sure you want to delete this classroom?')) return
    setClassError('')
    setClassSuccess('')

    try {
      const res = await fetch(`/api/admin/classrooms?id=${classId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setClassSuccess('Classroom deleted successfully!')
        fetchData()
      } else {
        setClassError(data.error || 'Failed to delete classroom.')
      }
    } catch (err) {
      setClassError('Connection failed.')
    }
  }

  const handleDeleteSelectedClassrooms = async () => {
    if (selectedClassroomsForPush.length === 0) return
    if (!window.confirm(`Are you sure you want to delete the ${selectedClassroomsForPush.length} selected classrooms?`)) return
    setClassError('')
    setClassSuccess('')

    try {
      const res = await fetch(`/api/admin/classrooms?ids=${selectedClassroomsForPush.join(',')}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setClassSuccess(data.message)
        setSelectedClassroomsForPush([])
        fetchData()
      } else {
        setClassError(data.error || 'Failed to delete selected classrooms.')
      }
    } catch (err) {
      setClassError('Connection failed.')
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setGroupError('')
    setGroupSuccess('')

    if (!groupName.trim()) return
    if (selectedClassroomIds.length === 0) {
      setGroupError('Please select at least one classroom.')
      return
    }

    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          classroomIds: selectedClassroomIds,
          language: lang,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setGroupSuccess(`Group '${groupName}' created successfully!`)
        setGroupName('')
        setSelectedClassroomIds([])
        fetchData()
      } else {
        setGroupError(data.error || 'Failed to create group.')
      }
    } catch (err) {
      setGroupError('Connection failed.')
    }
  }

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return
    setGroupError('')
    setGroupSuccess('')

    try {
      const res = await fetch('/api/admin/groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingGroup.id,
          name: editGroupName,
          classroomIds: editGroupClassroomIds,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setGroupSuccess('Group updated successfully!')
        setEditingGroup(null)
        fetchData()
      } else {
        setGroupError(data.error || 'Failed to update group.')
      }
    } catch (err) {
      setGroupError('Connection failed.')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return
    setGroupError('')
    setGroupSuccess('')

    try {
      const res = await fetch(`/api/admin/groups?id=${groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setGroupSuccess('Group deleted successfully!')
        fetchData()
      } else {
        setGroupError(data.error || 'Failed to delete group.')
      }
    } catch (err) {
      setGroupError('Connection failed.')
    }
  }

  const handleDeleteSelectedGroups = async () => {
    if (selectedGroupIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete the ${selectedGroupIds.length} selected groups?`)) return
    setGroupError('')
    setGroupSuccess('')

    try {
      const res = await fetch(`/api/admin/groups?ids=${selectedGroupIds.join(',')}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setGroupSuccess(data.message)
        setSelectedGroupIds([])
        fetchData()
      } else {
        setGroupError(data.error || 'Failed to delete selected groups.')
      }
    } catch (err) {
      setGroupError('Connection failed.')
    }
  }


  const toggleClassroomSelection = (classId: string) => {
    setSelectedClassroomIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    )
  }

  return (
    <div className="grid-2">
      {/* Tab: Classroom setup */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 className="card-title">{t.classroomsCreateClass}</h3>
        {classError && <div className="alert alert-danger">{classError}</div>}
        {classSuccess && <div className="alert alert-success">{classSuccess}</div>}

        <form onSubmit={handleCreateClassroom}>
          <div className="form-group">
            <label className="form-label">{t.classroomsClassName}</label>
            <input
              type="text"
              className="form-input"
              value={classroomName}
              onChange={(e) => setClassroomName(e.target.value)}
              placeholder={t.classroomsPlaceholderClass}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t.adminPushToSchools || "Link to Schools"}</label>
            <SchoolSelectorField
              schools={filteredSchoolsForClassrooms}
              selectedSchoolIds={selectedSchoolIds}
              setSelectedSchoolIds={setSelectedSchoolIds}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
            {t.classroomsCreateClassBtn}
          </button>
        </form>

        <h4 style={{ marginTop: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>{t.classroomsDatabase}</h4>
        
        {/* Bulk Action Buttons for Classrooms */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={selectedClassroomsForPush.length === classrooms.length && classrooms.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedClassroomsForPush(classrooms.map(c => c.id))
                } else {
                  setSelectedClassroomsForPush([])
                }
              }}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.85rem' }}>{t.adminSelectAll} ({selectedClassroomsForPush.length})</span>
          </div>
          {selectedClassroomsForPush.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              <button
                onClick={() => {
                  setEditingClassroom({ name: `${selectedClassroomsForPush.length} selected classrooms`, isBulk: true })
                  setEditSchoolIds([])
                }}
                className="btn btn-primary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', textTransform: 'none' }}
              >
                {t.adminPushSelected} ({selectedClassroomsForPush.length})
              </button>
              <button
                onClick={handleDeleteSelectedClassrooms}
                className="btn"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', textTransform: 'none', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000' }}
              >
                {t.adminDeleteSelected} ({selectedClassroomsForPush.length})
              </button>
            </div>
          )}
        </div>

        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
          {classrooms.map((cls) => {
            const isChecked = selectedClassroomsForPush.includes(cls.id)
            return (
              <div key={cls.id} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-muted)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedClassroomsForPush((prev) =>
                        prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                      )
                    }}
                    style={{ marginRight: '0.75rem', width: '16px', height: '16px', marginTop: '4px' }}
                  />
                  <div>
                    <strong>{cls.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.examsPushSchools || "Pushed to"}: {cls.schools.map((s: any) => s.name).join(', ') || t.adminNoSchools}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setEditingClassroomNameObj(cls)
                      setEditClassroomName(cls.name)
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none', height: 'fit-content' }}
                  >
                    {t.adminEditBtn}
                  </button>
                  <button
                    onClick={() => {
                      setEditingClassroom(cls)
                      setEditSchoolIds(cls.schools.map((s: any) => s.id))
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none', height: 'fit-content' }}
                  >
                    {t.adminPushBtn}
                  </button>
                  <button
                    onClick={() => handleDeleteClassroom(cls.id)}
                    className="btn"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none', height: 'fit-content', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000' }}
                  >
                    {t.adminDeleteBtn}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tab: Groups setup */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 className="card-title">{t.adminSetupGroups}</h3>
        {groupError && <div className="alert alert-danger">{groupError}</div>}
        {groupSuccess && <div className="alert alert-success">{groupSuccess}</div>}

        <form onSubmit={handleCreateGroup}>
          <div className="form-group">
            <label className="form-label">{t.classroomsGroupName}</label>
            <input
              type="text"
              className="form-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t.adminGroupPlaceholder}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t.adminSelectClassroomsInGroup}</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-muted)', padding: '0.75rem' }}>
              {classrooms.map((cls) => (
                <div key={cls.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedClassroomIds.includes(cls.id)}
                    onChange={() => toggleClassroomSelection(cls.id)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>{cls.name}</span>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
            {t.adminCreateGroup}
          </button>
        </form>

        <h4 style={{ marginTop: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>{t.adminCurrentGroups}</h4>
        
        {/* Bulk Action Buttons for Groups */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={selectedGroupIds.length === groups.length && groups.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedGroupIds(groups.map(g => g.id))
                } else {
                  setSelectedGroupIds([])
                }
              }}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.85rem' }}>{t.adminSelectAll} ({selectedGroupIds.length})</span>
          </div>
          {selectedGroupIds.length > 0 && (
            <button
              onClick={handleDeleteSelectedGroups}
              className="btn"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', textTransform: 'none', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000', marginLeft: 'auto' }}
            >
              {t.adminDeleteSelected} ({selectedGroupIds.length})
            </button>
          )}
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {groups.map((g) => {
            const isChecked = selectedGroupIds.includes(g.id)
            return (
              <div key={g.id} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-muted)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedGroupIds((prev) =>
                        prev.includes(g.id) ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                      )
                    }}
                    style={{ marginRight: '0.75rem', width: '16px', height: '16px', marginTop: '4px' }}
                  />
                  <div>
                    <strong>{g.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.adminContains}: {g.classrooms.map((c: any) => c.name).join(', ')}
                    </div>
                  </div>
                </div>
 
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => {
                      setEditingGroup(g)
                      setEditGroupName(g.name)
                      setEditGroupClassroomIds(g.classrooms.map((c: any) => c.id))
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none', height: 'fit-content' }}
                  >
                    {t.adminEditBtn}
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(g.id)}
                    className="btn"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none', height: 'fit-content', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000' }}
                  >
                    {t.adminDeleteBtn}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Push Classroom to Schools Modal */}
      {editingClassroom && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 className="card-title">{t.adminPushClassroomToSchools}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {t.adminSelectSchoolsToPushDesc} <strong>{editingClassroom.name}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">{t.adminSchoolsList}</label>
              <SchoolSelectorField
                schools={filteredSchoolsForClassrooms}
                selectedSchoolIds={editSchoolIds}
                setSelectedSchoolIds={setEditSchoolIds}
              />
            </div>
            <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingClassroom(null)} className="btn btn-secondary" style={{ textTransform: 'none' }}>
                {t.adminCancelBtn}
              </button>
              <button onClick={handleSavePush} className="btn btn-primary" style={{ textTransform: 'none' }}>
                {t.adminSaveChangesBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Classroom Name Modal */}
      {editingClassroomNameObj && (
        <div className="modal-overlay" style={{ zIndex: 1060 }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', padding: '2rem' }}>
            <h3 className="card-title">{t.adminEditClassroomName}</h3>
            <form onSubmit={handleUpdateClassroomName}>
              <div className="form-group">
                <label className="form-label">{t.classroomsClassName}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editClassroomName}
                  onChange={(e) => setEditClassroomName(e.target.value)}
                  required
                />
              </div>
              <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingClassroomNameObj(null)}
                  className="btn btn-secondary"
                  style={{ textTransform: 'none' }}
                >
                  {t.adminCancelBtn}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ textTransform: 'none' }}
                >
                  {t.adminSaveChangesBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="modal-overlay" style={{ zIndex: 1060 }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}>
            <h3 className="card-title">{t.adminEditGroupDetails}</h3>
            <form onSubmit={handleUpdateGroup}>
              <div className="form-group">
                <label className="form-label">{t.classroomsGroupName}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.adminSelectClassroomsInGroup}</label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-muted)', padding: '0.75rem' }}>
                  {classrooms.map((cls) => (
                    <div key={cls.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <input
                        type="checkbox"
                        checked={editGroupClassroomIds.includes(cls.id)}
                        onChange={() => setEditGroupClassroomIds((prev) =>
                          prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id]
                        )}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{cls.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="btn btn-secondary"
                  style={{ textTransform: 'none' }}
                >
                  {t.adminCancelBtn}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ textTransform: 'none' }}
                >
                  {t.adminUpdateGroup}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    )
  }

function AdminCategoriesTab({ token, lang }: { token: string | null; lang: Language }) {
  const t = translations[lang]
  const [categories, setCategories] = useState<any[]>([])

  // Form states - Category
  const [categoryName, setCategoryName] = useState('')
  const [subcatString, setSubcatString] = useState('')
  const [catError, setCatError] = useState('')
  const [catSuccess, setCatSuccess] = useState('')

  // Form states - CSV Questions upload
  const [selectedCatId, setSelectedCatId] = useState('')
  const [selectedSubcatId, setSelectedSubcatId] = useState('')
  const [csvContent, setCsvContent] = useState('')
  const [questionSetName, setQuestionSetName] = useState('')
  const [qError, setQError] = useState('')
  const [qSuccess, setQSuccess] = useState('')
  const [submittingQuestions, setSubmittingQuestions] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Language selectors
  const [viewLanguage, setViewLanguage] = useState('en')
  const [uploadLanguage, setUploadLanguage] = useState('en')

  // Translation modal states
  const [translatingQuestion, setTranslatingQuestion] = useState<any | null>(null)
  const [transQText, setTransQText] = useState('')
  const [transQOptionA, setTransQOptionA] = useState('')
  const [transQOptionB, setTransQOptionB] = useState('')
  const [transQOptionC, setTransQOptionC] = useState('')
  const [transQOptionD, setTransQOptionD] = useState('')
  const [transQCorrect, setTransQCorrect] = useState('A')
  const [transQLang, setTransQLang] = useState('hi')

  // Editing individual question states
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null)
  const [editQText, setEditQText] = useState('')
  const [editQOptionA, setEditQOptionA] = useState('')
  const [editQOptionB, setEditQOptionB] = useState('')
  const [editQOptionC, setEditQOptionC] = useState('')
  const [editQOptionD, setEditQOptionD] = useState('')
  const [editQCorrect, setEditQCorrect] = useState('A')
  const [editQReferenceImage, setEditQReferenceImage] = useState('')

  // Selections & expansion states
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [isBankExpanded, setIsBankExpanded] = useState(false)
  const [bankSets, setBankSets] = useState<string[]>([])
  const [filterQuestionSetName, setFilterQuestionSetName] = useState('')

  // Edit category states
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatSubcats, setEditCatSubcats] = useState('')

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/admin/categories?language=${lang}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchBankSets = async () => {
    if (!selectedCatId) {
      setBankSets([])
      return
    }
    try {
      let url = `/api/admin/questions?categoryId=${selectedCatId}&setsOnly=true&language=${lang}`
      if (selectedSubcatId) {
        url += `&subcategoryId=${selectedSubcatId}`
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.sets)) {
        setBankSets(data.sets)
      } else {
        setBankSets([])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchQuestions = async () => {
    setSelectedQuestionIds([])
    if (!selectedCatId) {
      setQuestions([])
      return
    }
    setLoadingQuestions(true)
    try {
      let url = `/api/admin/questions?categoryId=${selectedCatId}&language=${viewLanguage}`
      if (selectedSubcatId) {
        url += `&subcategoryId=${selectedSubcatId}`
      }
      if (filterQuestionSetName) {
        url += `&questionSetName=${encodeURIComponent(filterQuestionSetName)}`
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setQuestions(data.questions)
      }
      await fetchBankSets()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const csv = XLSX.utils.sheet_to_csv(worksheet)
          setCsvContent(csv)
        } catch (err) {
          setQError('Failed to parse Excel file.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setCsvContent(text)
      }
      reader.readAsText(file)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [token, lang])

  useEffect(() => {
    setFilterQuestionSetName('')
  }, [selectedCatId, selectedSubcatId])

  useEffect(() => {
    fetchQuestions()
  }, [selectedCatId, selectedSubcatId, filterQuestionSetName, lang, viewLanguage])

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCatError('')
    setCatSuccess('')

    const subcategories = subcatString.split(',').map((s) => s.trim()).filter(Boolean)

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryName,
          subcategories,
          language: lang,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCatSuccess(`Category '${categoryName}' added!`)
        setCategoryName('')
        setSubcatString('')
        fetchCategories()
      } else {
        setCatError(data.error || 'Failed to create category.')
      }
    } catch (err) {
      setCatError('Connection failed.')
    }
  }

  const startEditCategory = (cat: any) => {
    setEditingCategory(cat)
    setEditCatName(cat.name)
    setEditCatSubcats(cat.subcategories.map((s: any) => s.name).join(', '))
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    setCatError('')
    setCatSuccess('')

    const subcategories = editCatSubcats.split(',').map((s) => s.trim()).filter(Boolean)

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editCatName,
          subcategories,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCatSuccess(`Category '${editCatName}' updated!`)
        setEditingCategory(null)
        fetchCategories()
      } else {
        setCatError(data.error || 'Failed to update category.')
      }
    } catch (err) {
      setCatError('Connection failed.')
    }
  }

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"? This cannot be undone.`)) return
    setCatError('')
    setCatSuccess('')

    try {
      const res = await fetch(`/api/admin/categories?id=${catId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setCatSuccess(`Category '${catName}' deleted.`)
        if (selectedCatId === catId) {
          setSelectedCatId('')
          setSelectedSubcatId('')
        }
        fetchCategories()
      } else {
        setCatError(data.error || 'Failed to delete category.')
      }
    } catch (err) {
      setCatError('Connection failed.')
    }
  }
  const handleUploadQuestions = async (e: React.FormEvent) => {
    e.preventDefault()
    setQSuccess('')

    if (!selectedCatId) {
      setQError('Please select a category.')
      return
    }
    if (!csvContent.trim()) {
      setQError('Please enter CSV data.')
      return
    }

    setSubmittingQuestions(true)

    try {
      const res = await fetch('/api/admin/questions/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          csvData: csvContent,
          categoryId: selectedCatId,
          subcategoryId: selectedSubcatId || null,
          questionSetName: questionSetName,
          language: uploadLanguage,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setQSuccess(data.message)
        setCsvContent('')
        setQuestionSetName('')
        fetchQuestions()
      } else {
        setQError(data.error || 'Failed to upload questions.')
      }
    } catch (err) {
      setQError('Connection failed.')
    } finally {
      setSubmittingQuestions(false)
    }
  }

  const handleExportTemplate = () => {
    if (questions.length === 0) {
      alert('No questions available to export. Please select a category with questions first.')
      return
    }
    const headers = ['Code', 'Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Reference Image']
    const rows = questions.map(q => [
      q.code || '',
      q.text || '',
      q.optionA || '',
      q.optionB || '',
      q.optionC || '',
      q.optionD || '',
      q.correctOption || '',
      q.referenceImage || ''
    ])
    const csvStr = [headers, ...rows].map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `translation_template_${viewLanguage}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleStartTranslateQuestion = (q: any) => {
    setTranslatingQuestion(q)
    setTransQText('')
    setTransQOptionA('')
    setTransQOptionB('')
    setTransQOptionC('')
    setTransQOptionD('')
    setTransQCorrect(q.correctOption)
    setTransQLang('hi')
  }

  const handleCreateTranslation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!translatingQuestion) return

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: translatingQuestion.id,
          text: transQText,
          optionA: transQOptionA,
          optionB: transQOptionB,
          optionC: transQOptionC,
          optionD: transQOptionD,
          correctOption: transQCorrect,
          referenceImage: translatingQuestion.referenceImage,
          language: transQLang,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setQSuccess('Translation saved successfully!')
        setTranslatingQuestion(null)
        fetchQuestions()
      } else {
        setQError(data.error || 'Failed to save translation.')
      }
    } catch (err) {
      setQError('Connection failed.')
    }
  }

  const handleStartEditQuestion = (q: any) => {
    setEditingQuestion(q)
    setEditQText(q.text)
    setEditQOptionA(q.optionA)
    setEditQOptionB(q.optionB)
    setEditQOptionC(q.optionC)
    setEditQOptionD(q.optionD)
    setEditQCorrect(q.correctOption)
    setEditQReferenceImage(q.referenceImage || '')
  }

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuestion) return

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingQuestion.id,
          text: editQText,
          optionA: editQOptionA,
          optionB: editQOptionB,
          optionC: editQOptionC,
          optionD: editQOptionD,
          correctOption: editQCorrect,
          referenceImage: editQReferenceImage || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setQSuccess('Question updated successfully!')
        setEditingQuestion(null)
        fetchQuestions()
      } else {
        setQError(data.error || 'Failed to update question.')
      }
    } catch (err) {
      setQError('Connection failed.')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question? This will remove it from all exams.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.success) {
        setQSuccess('Question deleted successfully!')
        fetchQuestions()
      } else {
        setQError(data.error || 'Failed to delete question.')
      }
    } catch (err) {
      setQError('Connection failed.')
    }
  }

  const handleDeleteEntireBank = async () => {
    if (!selectedCatId) return
    const categoryName = categories.find(c => c.id === selectedCatId)?.name || 'selected category'
    const subcategoryName = currentSubcategories.find((s: any) => s.id === selectedSubcatId)?.name
    const targetLabel = subcategoryName ? `${categoryName} > ${subcategoryName}` : categoryName

    const confirmMsg = filterQuestionSetName
      ? `WARNING: Are you sure you want to delete the question set "${filterQuestionSetName}" for "${targetLabel}"? This will delete all ${questions.length} questions in this set and remove them from all exams!`
      : `WARNING: Are you sure you want to delete the ENTIRE question bank for "${targetLabel}"? This will delete all ${questions.length} questions and remove them from all exams!`

    if (!window.confirm(confirmMsg)) {
      return
    }

    try {
      let url = `/api/admin/questions?categoryId=${selectedCatId}`
      if (selectedSubcatId) {
        url += `&subcategoryId=${selectedSubcatId}`
      }
      if (filterQuestionSetName) {
        url += `&questionSetName=${encodeURIComponent(filterQuestionSetName)}`
      }
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setQSuccess(data.message)
        setIsBankExpanded(false)
        setFilterQuestionSetName('')
        fetchQuestions()
      } else {
        setQError(data.error || 'Failed to delete question bank.')
      }
    } catch (err) {
      setQError('Connection failed.')
    }
  }

  const handleDeleteSelectedQuestions = async () => {
    if (selectedQuestionIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete the ${selectedQuestionIds.length} selected questions? This will remove them from all exams.`)) {
      return
    }

    try {
      const idsStr = selectedQuestionIds.join(',')
      const res = await fetch(`/api/admin/questions?ids=${idsStr}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setQSuccess(data.message)
        setSelectedQuestionIds([])
        fetchQuestions()
      } else {
        setQError(data.error || 'Failed to delete questions.')
      }
    } catch (err) {
      setQError('Connection failed.')
    }
  }

  // Get subcategories of selected category
  const selectedCatObj = categories.find((c) => c.id === selectedCatId)
  const currentSubcategories = selectedCatObj?.subcategories || []

  return (
    <div className="grid-2">
      {/* Category Creation Form */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 className="card-title">{t.categoriesCreateCat}</h3>
        {catError && <div className="alert alert-danger">{catError}</div>}
        {catSuccess && <div className="alert alert-success">{catSuccess}</div>}

        <form onSubmit={handleCreateCategory}>
          <div className="form-group">
            <label className="form-label">{t.categoriesCatName}</label>
            <input
              type="text"
              className="form-input"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder={t.categoriesPlaceholderCat}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t.categoriesSubcats}</label>
            <input
              type="text"
              className="form-input"
              value={subcatString}
              onChange={(e) => setSubcatString(e.target.value)}
              placeholder={t.categoriesPlaceholderSubcats}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
            {t.categoriesCreateCatBtn}
          </button>
        </form>

        <h4 style={{ marginTop: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>{t.categoriesDatabase}</h4>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {categories.map((cat) => (
            <div key={cat.id} style={{ padding: '0.5rem 0.5rem', borderBottom: '1px solid var(--border-muted)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{cat.name}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Subcategories: {cat.subcategories.map((s: any) => s.name).join(', ') || 'None'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <button
                  onClick={() => startEditCategory(cat)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', transition: 'background 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'none')}
                  title="Edit category"
                >✏️</button>
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', transition: 'background 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'none')}
                  title="Delete category"
                >🗑️</button>
              </div>
            </div>
          ))}
          {categories.length === 0 && <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>No categories yet</div>}
        </div>

        {/* Edit Category Modal */}
        {editingCategory && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
               onClick={() => setEditingCategory(null)}>
            <div className="card" style={{ width: '90%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 0 }}
                 onClick={e => e.stopPropagation()}>
              <h3 className="card-title" style={{ margin: '0 0 1rem 0' }}>Edit Category</h3>
              <form onSubmit={handleUpdateCategory}>
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCatName}
                    onChange={e => setEditCatName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subcategories (Comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCatSubcats}
                    onChange={e => setEditCatSubcats(e.target.value)}
                    placeholder="e.g. Algebra, Geometry"
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingCategory(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* CSV Question Upload Form */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 className="card-title">{t.categoriesUploadQuestions}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          {t.categoriesCsvDesc}
        </p>
        {qError && <div className="alert alert-danger">{qError}</div>}
        {qSuccess && <div className="alert alert-success">{qSuccess}</div>}

        <form onSubmit={handleUploadQuestions}>
          <div className="grid-2" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">{t.categoriesCatName}</label>
              <select value={selectedCatId} onChange={(e) => { setSelectedCatId(e.target.value); setSelectedSubcatId(''); }} required>
                <option value="">{t.categoriesSelectCatPlaceholder}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.categoriesSubcatOptional}</label>
              <select
                value={selectedSubcatId}
                onChange={(e) => setSelectedSubcatId(e.target.value)}
                disabled={!selectedCatId}
              >
                <option value="">{t.categoriesNone}</option>
                {currentSubcategories.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Upload Language</label>
              <select value={uploadLanguage} onChange={(e) => setUploadLanguage(e.target.value)}>
                <option value="en">English (en)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary w-full"
                onClick={handleExportTemplate}
                style={{ width: '100%', height: '38px', fontSize: '0.8rem', textTransform: 'none' }}
              >
                📥 Export Translation Template
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t.categoriesSetName}</label>
            <input
              type="text"
              className="form-input"
              value={questionSetName}
              onChange={(e) => setQuestionSetName(e.target.value)}
              placeholder={t.categoriesPlaceholderSet}
            />
          </div>


          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t.categoriesCsvLabel}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 'normal', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                {t.categoriesUploadFileLabel} <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} style={{ fontSize: '0.75rem', maxWidth: '170px' }} />
              </span>
            </label>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: '1.4', backgroundColor: '#f5f7f8', padding: '0.5rem 0.75rem', borderRadius: '4px', borderLeft: '3px solid var(--accent-gold)' }}>
              {t.categoriesImageSupportTip}
            </div>
            <textarea
              className="form-input"
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder={t.categoriesCsvPlaceholder}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }} disabled={submittingQuestions}>
            {submittingQuestions ? t.categoriesUploading : t.categoriesUploadBtn}
          </button>
        </form>
      </div>
      {/* Seeded Questions List Collapsible Row */}
      <div className="card" style={{ gridColumn: 'span 2', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isBankExpanded && selectedCatId ? '1px solid var(--border-muted)' : 'none', paddingBottom: isBankExpanded && selectedCatId ? '0.75rem' : '0' }}>
          <div 
            onClick={() => { if (selectedCatId) setIsBankExpanded(!isBankExpanded) }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: selectedCatId ? 'pointer' : 'default', flexGrow: 1 }}
          >
            <span style={{ fontSize: '1.2rem', transform: isBankExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
              ▶
            </span>
            <h3 className="card-title" style={{ border: 'none', margin: 0, padding: 0 }}>
              Seeded Questions Bank {selectedCatId ? `(${questions.length} questions)` : ''}
            </h3>
          </div>
          
          {selectedCatId && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleDeleteEntireBank}
                className="btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', textTransform: 'none', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000' }}
              >
                {filterQuestionSetName ? `Delete Set: ${filterQuestionSetName}` : 'Delete Entire Bank'}
              </button>
            </div>
          )}
        </div>

        {/* Collapsed Warning if not expanded */}
        {!isBankExpanded && selectedCatId && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
            Click row above to expand and inspect individual questions.
          </div>
        )}

        {/* Main Content Area */}
        {!selectedCatId ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2.5rem' }}>
            Please select a <strong>Category</strong> in the upload form above to inspect its seeded question bank.
          </div>
        ) : isBankExpanded ? (
          <div style={{ marginTop: '1.5rem' }}>
            {loadingQuestions ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading questions...</div>
            ) : (
              <div>
                {/* Question View Filters */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>View Language:</span>
                    <select
                      value={viewLanguage}
                      onChange={(e) => setViewLanguage(e.target.value)}
                      style={{ width: '120px', fontSize: '0.85rem', padding: '0.35rem', fontFamily: 'var(--font-sans)', margin: 0 }}
                    >
                      <option value="en">English (en)</option>
                      <option value="hi">Hindi (hi)</option>
                    </select>
                  </div>
                  {bankSets.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Filter by Question Set:</span>
                      <select
                        value={filterQuestionSetName}
                        onChange={(e) => setFilterQuestionSetName(e.target.value)}
                        style={{ maxWidth: '250px', fontSize: '0.85rem', padding: '0.35rem', fontFamily: 'var(--font-sans)', margin: 0 }}
                      >
                        <option value="">-- All Sets --</option>
                        {bankSets.map(setName => (
                          <option key={setName} value={setName}>{setName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {questions.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2.5rem' }}>
                    No questions found {filterQuestionSetName ? `in set "${filterQuestionSetName}"` : 'in this category'}.
                  </div>
                ) : (
                  <div>

                {/* Bulk Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#fcfaf7', border: '1px solid var(--border-muted)', marginBottom: '1.5rem', borderRadius: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.length === questions.length && questions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestionIds(questions.map(q => q.id))
                        } else {
                          setSelectedQuestionIds([])
                        }
                      }}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                      Select All ({selectedQuestionIds.length} of {questions.length} selected)
                    </span>
                  </div>
                  {selectedQuestionIds.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleDeleteSelectedQuestions}
                        className="btn"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', textTransform: 'none', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000' }}
                      >
                        Delete Selected ({selectedQuestionIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionIds([])}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', textTransform: 'none' }}
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>

                {/* Questions list */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {questions.map((q, idx) => {
                    const isChecked = selectedQuestionIds.includes(q.id)
                    return (
                      <div key={q.id} style={{ border: '1px solid var(--border-muted)', padding: '1.25rem', borderRadius: '2px', backgroundColor: '#ffffff', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedQuestionIds(prev => 
                              prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                            )
                          }}
                          style={{ width: '18px', height: '18px', marginTop: '4px', flexShrink: 0 }}
                        />
                        <div style={{ flexGrow: 1 }}>
                          <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                            <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--primary-navy)', textAlign: 'left' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: '#f0f2f5', padding: '1px 6px', borderRadius: '3px' }}>Code: {q.code}</span>
                                <span style={{ fontSize: '0.75rem', color: '#ffffff', backgroundColor: '#2e7d32', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>EN</span>
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  color: q.translations?.some((t: any) => t.language === 'hi') ? '#ffffff' : '#757575', 
                                  backgroundColor: q.translations?.some((t: any) => t.language === 'hi') ? '#2e7d32' : '#e0e0e0', 
                                  padding: '1px 5px', 
                                  borderRadius: '3px', 
                                  fontWeight: 'bold' 
                                }}>HI</span>
                              </div>
                              Q{idx + 1}. {q.text}
                              {q.referenceImage && (
                                <img 
                                  src={q.referenceImage.trim()} 
                                  style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain', display: 'block', borderRadius: '4px', marginTop: '0.5rem' }} 
                                  alt="Ref" 
                                />
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleStartTranslateQuestion(q)}
                                className="btn btn-outline"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textTransform: 'none', height: 'fit-content' }}
                              >
                                Translate
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditQuestion(q)}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textTransform: 'none', height: 'fit-content' }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textTransform: 'none', height: 'fit-content', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div style={{
                              padding: '0.5rem 0.75rem', 
                              border: '1px solid var(--border-muted)', 
                              borderRadius: '2px',
                              fontSize: '0.9rem',
                              backgroundColor: q.correctOption === 'A' ? '#e2f0d9' : '#ffffff',
                              borderColor: q.correctOption === 'A' ? '#a9d08e' : 'var(--border-muted)',
                              color: q.correctOption === 'A' ? '#385723' : 'var(--text-color)',
                              fontWeight: q.correctOption === 'A' ? 'bold' : 'normal',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              flexWrap: 'wrap'
                            }}>
                              <strong>A.</strong> {renderContent(q.optionA)}
                            </div>
                            <div style={{
                              padding: '0.5rem 0.75rem', 
                              border: '1px solid var(--border-muted)', 
                              borderRadius: '2px',
                              fontSize: '0.9rem',
                              backgroundColor: q.correctOption === 'B' ? '#e2f0d9' : '#ffffff',
                              borderColor: q.correctOption === 'B' ? '#a9d08e' : 'var(--border-muted)',
                              color: q.correctOption === 'B' ? '#385723' : 'var(--text-color)',
                              fontWeight: q.correctOption === 'B' ? 'bold' : 'normal',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              flexWrap: 'wrap'
                            }}>
                              <strong>B.</strong> {renderContent(q.optionB)}
                            </div>
                            <div style={{
                              padding: '0.5rem 0.75rem', 
                              border: '1px solid var(--border-muted)', 
                              borderRadius: '2px',
                              fontSize: '0.9rem',
                              backgroundColor: q.correctOption === 'C' ? '#e2f0d9' : '#ffffff',
                              borderColor: q.correctOption === 'C' ? '#a9d08e' : 'var(--border-muted)',
                              color: q.correctOption === 'C' ? '#385723' : 'var(--text-color)',
                              fontWeight: q.correctOption === 'C' ? 'bold' : 'normal',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              flexWrap: 'wrap'
                            }}>
                              <strong>C.</strong> {renderContent(q.optionC)}
                            </div>
                            <div style={{
                              padding: '0.5rem 0.75rem', 
                              border: '1px solid var(--border-muted)', 
                              borderRadius: '2px',
                              fontSize: '0.9rem',
                              backgroundColor: q.correctOption === 'D' ? '#e2f0d9' : '#ffffff',
                              borderColor: q.correctOption === 'D' ? '#a9d08e' : 'var(--border-muted)',
                              color: q.correctOption === 'D' ? '#385723' : 'var(--text-color)',
                              fontWeight: q.correctOption === 'D' ? 'bold' : 'normal',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              flexWrap: 'wrap'
                            }}>
                              <strong>D.</strong> {renderContent(q.optionD)}
                            </div>
                          </div>
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                            Correct Answer: <strong style={{ color: '#385723' }}>Option {q.correctOption}</strong>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                </div>
              )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Editing Question Modal Overlay */}
      {editingQuestion && (
        <div className="modal-overlay" style={{ zIndex: 1060 }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h3 className="card-title">Edit Question Details</h3>
            <form onSubmit={handleUpdateQuestion}>
              <div className="form-group">
                <label className="form-label">Question Text</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editQText}
                  onChange={(e) => setEditQText(e.target.value)}
                  required
                />
              </div>
              <div className="grid-2" style={{ gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">Option A</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editQOptionA}
                    onChange={(e) => setEditQOptionA(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Option B</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editQOptionB}
                    onChange={(e) => setEditQOptionB(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Option C</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editQOptionC}
                    onChange={(e) => setEditQOptionC(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Option D</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editQOptionD}
                    onChange={(e) => setEditQOptionD(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Reference Image (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editQReferenceImage}
                  onChange={(e) => setEditQReferenceImage(e.target.value)}
                  placeholder="Image URL or data:image base64 string..."
                />
              </div>
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Correct Option</label>
                <select
                  value={editQCorrect}
                  onChange={(e) => setEditQCorrect(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                  required
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
              <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="btn btn-secondary"
                  style={{ textTransform: 'none' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ textTransform: 'none' }}
                >
                  Update Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Translating Question Modal Overlay */}
      {translatingQuestion && (
        <div className="modal-overlay" style={{ zIndex: 1060 }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h3 className="card-title">Add Translation</h3>
            
            {/* English Read-Only Reference */}
            <div style={{ backgroundColor: '#f5f7f8', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid var(--primary-navy)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>English Reference (Original)</div>
              <div style={{ marginBottom: '0.5rem' }}><strong>Q.</strong> {translatingQuestion.text}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                <div><strong>A:</strong> {translatingQuestion.optionA}</div>
                <div><strong>B:</strong> {translatingQuestion.optionB}</div>
                <div><strong>C:</strong> {translatingQuestion.optionC}</div>
                <div><strong>D:</strong> {translatingQuestion.optionD}</div>
              </div>
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Correct: {translatingQuestion.correctOption}</div>
            </div>

            <form onSubmit={handleCreateTranslation}>
              <div className="form-group">
                <label className="form-label">Translation Language</label>
                <select value={transQLang} onChange={(e) => setTransQLang(e.target.value)} required>
                  <option value="hi">Hindi (hi)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Translated Question Text</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={transQText}
                  onChange={(e) => setTransQText(e.target.value)}
                  placeholder="Enter translation..."
                  required
                />
              </div>
              <div className="grid-2" style={{ gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">Translated Option A</label>
                  <input
                    type="text"
                    className="form-input"
                    value={transQOptionA}
                    onChange={(e) => setTransQOptionA(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Translated Option B</label>
                  <input
                    type="text"
                    className="form-input"
                    value={transQOptionB}
                    onChange={(e) => setTransQOptionB(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Translated Option C</label>
                  <input
                    type="text"
                    className="form-input"
                    value={transQOptionC}
                    onChange={(e) => setTransQOptionC(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Translated Option D</label>
                  <input
                    type="text"
                    className="form-input"
                    value={transQOptionD}
                    onChange={(e) => setTransQOptionD(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Correct Option</label>
                <select
                  value={transQCorrect}
                  onChange={(e) => setTransQCorrect(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                  required
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
              <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setTranslatingQuestion(null)}
                  className="btn btn-secondary"
                  style={{ textTransform: 'none' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ textTransform: 'none' }}
                >
                  Save Translation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    )
  }

// Sub-Tab 4: Exams Management
function AdminExamsTab({ token, lang }: { token: string | null; lang: Language }) {
  const t = translations[lang]
  const [schools, setSchools] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])

  // Form states
  const [examName, setExamName] = useState('')
  const [examNameHindi, setExamNameHindi] = useState('')
  const [selectedCatId, setSelectedCatId] = useState('')
  const [selectedSubcatId, setSelectedSubcatId] = useState('')
  const [duration, setDuration] = useState('')
  const [questionCount, setQuestionCount] = useState('')
  const [marksPerQuestion, setMarksPerQuestion] = useState('')
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Editing states
  const [editingExam, setEditingExam] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editNameHindi, setEditNameHindi] = useState('')
  const [editCatId, setEditCatId] = useState('')
  const [editSubcatId, setEditSubcatId] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editQuestionCount, setEditQuestionCount] = useState('')
  const [editMarksPerQuestion, setEditMarksPerQuestion] = useState('')
  const [editSchoolIds, setEditSchoolIds] = useState<string[]>([])
  const [editGroupIds, setEditGroupIds] = useState<string[]>([])

  // Question sets states
  const [availableSets, setAvailableSets] = useState<string[]>([])
  const [selectedQuestionSetName, setSelectedQuestionSetName] = useState('')
  const [editAvailableSets, setEditAvailableSets] = useState<string[]>([])
  const [editQuestionSetName, setEditQuestionSetName] = useState('')

  // Memoized selectors for active language
  const filteredSchoolsForExams = React.useMemo(() => {
    return schools.filter(s => (s.language || 'en') === lang)
  }, [schools, lang])

  const filteredExams = React.useMemo(() => {
    return exams.filter(ex => (ex.language || 'en') === lang)
  }, [exams, lang])

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const resSchools = await fetch(`/api/admin/schools?language=${lang}`, { headers })
      const dSchools = await resSchools.json()
      if (dSchools.success) setSchools(dSchools.schools)

      const resCategories = await fetch(`/api/admin/categories?language=${lang}`, { headers })
      const dCategories = await resCategories.json()
      if (dCategories.success) setCategories(dCategories.categories)

      const resGroups = await fetch(`/api/admin/groups?language=${lang}`, { headers })
      const dGroups = await resGroups.json()
      if (dGroups.success) setGroups(dGroups.groups)

      const resExams = await fetch(`/api/admin/exams?language=${lang}`, { headers })
      const dExams = await resExams.json()
      if (dExams.success) setExams(dExams.exams)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchQuestionSets = async (catId: string, subcatId?: string) => {
    if (!catId) {
      setAvailableSets([])
      setSelectedQuestionSetName('')
      return
    }
    try {
      let url = `/api/admin/questions?categoryId=${catId}&setsOnly=true&language=${lang}`
      if (subcatId) {
        url += `&subcategoryId=${subcatId}`
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.sets)) {
        setAvailableSets(data.sets)
        if (data.sets.length === 1) {
          setSelectedQuestionSetName(data.sets[0])
        } else {
          setSelectedQuestionSetName('')
        }
      } else {
        setAvailableSets([])
        setSelectedQuestionSetName('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchEditQuestionSets = async (catId: string, subcatId?: string, defaultSetName?: string) => {
    if (!catId) {
      setEditAvailableSets([])
      setEditQuestionSetName('')
      return
    }
    try {
      let url = `/api/admin/questions?categoryId=${catId}&setsOnly=true&language=${lang}`
      if (subcatId) {
        url += `&subcategoryId=${subcatId}`
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.sets)) {
        setEditAvailableSets(data.sets)
        if (defaultSetName && data.sets.includes(defaultSetName)) {
          setEditQuestionSetName(defaultSetName)
        } else if (data.sets.length === 1) {
          setEditQuestionSetName(data.sets[0])
        } else {
          setEditQuestionSetName('')
        }
      } else {
        setEditAvailableSets([])
        setEditQuestionSetName('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token, lang])

  useEffect(() => {
    fetchQuestionSets(selectedCatId, selectedSubcatId)
  }, [selectedCatId, selectedSubcatId, lang])

  useEffect(() => {
    if (editingExam) {
      fetchEditQuestionSets(editCatId, editSubcatId)
    }
  }, [editCatId, editSubcatId, editingExam, lang])

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (selectedSchoolIds.length === 0) {
      setError('Please push this exam to at least one school.')
      return
    }
    if (selectedGroupIds.length === 0) {
      setError('Please target at least one classroom group.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: examName,
          nameHindi: examNameHindi,
          categoryId: selectedCatId,
          subcategoryId: selectedSubcatId || null,
          duration: parseInt(duration),
          questionCount: parseInt(questionCount),
          marksPerQuestion: parseFloat(marksPerQuestion),
          schoolIds: selectedSchoolIds,
          groupIds: selectedGroupIds,
          questionSetName: selectedQuestionSetName || null,
          language: lang,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(`Exam '${examName}' created and pushed!`)
        setExamName('')
        setExamNameHindi('')
        setSelectedCatId('')
        setSelectedSubcatId('')
        setDuration('')
        setQuestionCount('')
        setMarksPerQuestion('')
        setSelectedSchoolIds([])
        setSelectedGroupIds([])
        setSelectedQuestionSetName('')
        setAvailableSets([])
        fetchData()
      } else {
        setError(data.error || 'Failed to create exam.')
      }
    } catch (err: any) {
      setError('Connection failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('Are you sure you want to delete this exam? ALL registered student scores and active attempts for this exam will also be permanently deleted.')) return
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/exams?id=${examId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Exam and associated student progress deleted successfully!')
        fetchData()
      } else {
        setError(data.error || 'Failed to delete exam.')
      }
    } catch (err) {
      setError('Connection failed.')
    }
  }

  const handleStartEditExam = (ex: any) => {
    const resolvedSchoolIds = schools.filter(s => ex.schools.includes(s.name)).map(s => s.id)
    const resolvedGroupIds = groups.filter(g => ex.groups.includes(g.name)).map(g => g.id)
    const resolvedCat = categories.find(c => c.name === ex.categoryName)
    const resolvedSubcat = resolvedCat?.subcategories?.find((s: any) => s.name === ex.subcategoryName)

    setEditingExam(ex)
    setEditName(ex.name)
    setEditNameHindi(ex.nameHindi || '')
    setEditCatId(resolvedCat ? resolvedCat.id : '')
    setEditSubcatId(resolvedSubcat ? resolvedSubcat.id : '')
    setEditDuration(String(ex.duration))
    setEditQuestionCount(String(ex.questionCount))
    setEditMarksPerQuestion(String(ex.marksPerQuestion))
    setEditSchoolIds(resolvedSchoolIds)
    setEditGroupIds(resolvedGroupIds)

    if (resolvedCat) {
      fetchEditQuestionSets(resolvedCat.id, resolvedSubcat?.id, ex.questionSetName || '')
    }
  }

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (editSchoolIds.length === 0) {
      setError('Please target at least one school.')
      return
    }
    if (editGroupIds.length === 0) {
      setError('Please target at least one group.')
      return
    }

    try {
      const res = await fetch('/api/admin/exams', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingExam.id,
          name: editName,
          nameHindi: editNameHindi,
          categoryId: editCatId,
          subcategoryId: editSubcatId || null,
          duration: parseInt(editDuration),
          questionCount: parseInt(editQuestionCount),
          marksPerQuestion: parseFloat(editMarksPerQuestion),
          schoolIds: editSchoolIds,
          groupIds: editGroupIds,
          questionSetName: editQuestionSetName || null,
          language: lang,
        })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Exam updated successfully!')
        setEditingExam(null)
        setEditQuestionSetName('')
        setEditAvailableSets([])
        fetchData()
      } else {
        setError(data.error || 'Failed to update exam.')
      }
    } catch (err) {
      setError('Connection failed.')
    }
  }

  const selectedCatObj = categories.find((c) => c.id === selectedCatId)
  const currentSubcategories = selectedCatObj?.subcategories || []

  return (
    <div className="grid-2">
      {/* Create Exam Card */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 className="card-title">{t.examsCreateExam}</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleCreateExam}>
          <div className="form-group">
            <label className="form-label">{t.examsExamName}</label>
            <input
              type="text"
              className="form-input"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder={t.examsPlaceholderName}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.examsExamNameHindi}</label>
            <input
              type="text"
              className="form-input"
              value={examNameHindi}
              onChange={(e) => setExamNameHindi(e.target.value)}
              placeholder={t.examsPlaceholderNameHindi}
            />
          </div>

          <div className="grid-2" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">{t.categoriesCatName}</label>
              <select value={selectedCatId} onChange={(e) => { setSelectedCatId(e.target.value); setSelectedSubcatId(''); }} required>
                <option value="">{t.categoriesSelectCatPlaceholder}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.categoriesSubcatOptional}</label>
              <select
                value={selectedSubcatId}
                onChange={(e) => setSelectedSubcatId(e.target.value)}
                disabled={!selectedCatId}
              >
                <option value="">{t.categoriesNone}</option>
                {currentSubcategories.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Set Select Field */}
          {selectedCatId && (
            <div className="form-group" style={{ marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              <label className="form-label">{t.examsQuestionSet}</label>
              {availableSets.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                   {t.adminNoQuestionSetsUploaded}
                </div>
              ) : availableSets.length === 1 ? (
                <div style={{ padding: '0.4rem', border: '1px solid var(--border-muted)', borderRadius: '4px', backgroundColor: 'var(--bg-muted)', fontSize: '0.85rem' }}>
                  <strong>{availableSets[0]}</strong> <span style={{ color: 'var(--text-muted)' }}>{t.adminSelectedAutomatically}</span>
                </div>
              ) : (
                <select
                  value={selectedQuestionSetName}
                  onChange={(e) => setSelectedQuestionSetName(e.target.value)}
                  required
                >
                  <option value="">{t.examsChooseSet}</option>
                  {availableSets.map((setName) => (
                    <option key={setName} value={setName}>
                      {setName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid-3" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.examsDurationLabel}</label>
              <input
                type="number"
                className="form-input"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={t.adminMins}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.examsQuestionCount}</label>
              <input
                type="number"
                className="form-input"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                placeholder={t.adminPlaceholderQCount}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.examsMarkPerQ}</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(e.target.value)}
                placeholder={t.adminPlaceholderMarks}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">{t.examsPushSchools}</label>
              <SchoolSelectorField
                schools={filteredSchoolsForExams}
                selectedSchoolIds={selectedSchoolIds}
                setSelectedSchoolIds={setSelectedSchoolIds}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.examsTargetGroups}</label>
              <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-muted)', padding: '0.5rem' }}>
                {groups.map((g) => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(g.id)}
                      onChange={() => setSelectedGroupIds((prev) =>
                        prev.includes(g.id) ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                      )}
                      style={{ marginRight: '0.4rem' }}
                    />
                    <span style={{ fontSize: '0.85rem' }}>{g.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
            {submitting ? t.adminCreatingExam : t.examsCreateBtn}
          </button>
        </form>
      </div>

      {/* Active Exams List */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 className="card-title">{t.examsPushedDatabase}</h3>
        <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{t.adminExamName}</th>
                <th>{t.adminTargetScope}</th>
                <th>{t.adminStats}</th>
                <th style={{ textAlign: 'right' }}>{t.adminActions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t.examsNoExams}</td>
                </tr>
              ) : (
                filteredExams.map((ex) => (
                  <tr key={ex.id}>
                    <td>
                      <strong>{ex.name}</strong>
                      <span className="badge badge-outline" style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
                        {ex.language?.toUpperCase() || 'EN'}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {ex.categoryName} {ex.subcategoryName ? `> ${ex.subcategoryName}` : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t.adminQuestionSet || "Set"}: <span style={{ color: 'var(--accent-gold)' }}>{ex.questionSetName || t.adminDefaultSet || 'Default Set'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {t.examsDurationLabel || "Duration"}: {ex.duration}m | Qs: {ex.questionCount} | Marks/Q: {ex.marksPerQuestion}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <div>{t.adminTargetSchoolsLabel || "Schools"}: {ex.schools.join(', ')}</div>
                      <div>{t.adminTargetGroupsLabel || "Groups"}: {ex.groups.join(', ')}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {t.adminPool || "Pool"}: {ex.totalPoolQuestions} Qs<br />
                      {t.adminAttempts || "Attempts"}: {ex.totalAttempts}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleStartEditExam(ex)}
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none' }}
                        >
                          {t.adminEditBtn}
                        </button>
                        <button
                          onClick={() => handleDeleteExam(ex.id)}
                          className="btn"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textTransform: 'none', backgroundColor: '#c00000', color: '#ffffff', borderColor: '#c00000' }}
                        >
                          {t.adminDeleteBtn}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Exam Modal */}
      {editingExam && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '550px', width: '95%' }}>
            <h3 className="modal-title">{t.examsEditTitle || "Edit Exam Settings"}</h3>
            <form onSubmit={handleUpdateExam}>
              <div className="form-group">
                <label className="form-label">{t.examsExamName}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.examsExamNameHindi}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editNameHindi}
                  onChange={(e) => setEditNameHindi(e.target.value)}
                />
              </div>

              <div className="grid-2" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">{t.categoriesCatName}</label>
                  <select value={editCatId} onChange={(e) => { setEditCatId(e.target.value); setEditSubcatId(''); }} required>
                    <option value="">{t.categoriesSelectCatPlaceholder}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t.categoriesSubcatOptional}</label>
                  <select
                    value={editSubcatId}
                    onChange={(e) => setEditSubcatId(e.target.value)}
                    disabled={!editCatId}
                  >
                    <option value="">{t.categoriesNone}</option>
                    {categories.find(c => c.id === editCatId)?.subcategories?.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Set Select Field */}
              {editCatId && (
                <div className="form-group" style={{ marginTop: '0.25rem', marginBottom: '1.25rem' }}>
                  <label className="form-label">{t.examsQuestionSet}</label>
                  {editAvailableSets.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                       {t.adminNoQuestionSetsUploaded}
                    </div>
                  ) : editAvailableSets.length === 1 ? (
                    <div style={{ padding: '0.4rem', border: '1px solid var(--border-muted)', borderRadius: '4px', backgroundColor: 'var(--bg-muted)', fontSize: '0.85rem' }}>
                      <strong>{editAvailableSets[0]}</strong> <span style={{ color: 'var(--text-muted)' }}>{t.adminSelectedAutomatically}</span>
                    </div>
                  ) : (
                    <select
                      value={editQuestionSetName}
                      onChange={(e) => setEditQuestionSetName(e.target.value)}
                      required
                    >
                      <option value="">{t.examsChooseSet}</option>
                      {editAvailableSets.map((setName) => (
                        <option key={setName} value={setName}>
                          {setName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid-3" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t.examsDurationLabel}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t.examsQuestionCount}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editQuestionCount}
                    onChange={(e) => setEditQuestionCount(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t.examsMarkPerQ}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={editMarksPerQuestion}
                    onChange={(e) => setEditMarksPerQuestion(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.examsPushSchools}</label>
                  <SchoolSelectorField
                    schools={filteredSchoolsForExams}
                    selectedSchoolIds={editSchoolIds}
                    setSelectedSchoolIds={setEditSchoolIds}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.examsTargetGroups}</label>
                  <div style={{ maxHeight: '110px', overflowY: 'auto', border: '1px solid var(--border-muted)', padding: '0.4rem' }}>
                    {groups.map((g) => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editGroupIds.includes(g.id)}
                          onChange={() => setEditGroupIds((prev) =>
                            prev.includes(g.id) ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                          )}
                          style={{ marginRight: '0.4rem' }}
                        />
                        <span style={{ fontSize: '0.8rem' }}>{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="btn btn-secondary"
                  style={{ textTransform: 'none' }}
                >
                  {t.adminCancelBtn}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ textTransform: 'none' }}
                >
                  {t.adminSaveChangesBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-Tab 5: Leaderboard Results view & Export
// AdminResultsTab component has been merged into AdminAnalyticsTab and is no longer needed.

/* ==========================================
   VIEW: STUDENT DASHBOARD
   ========================================== */
