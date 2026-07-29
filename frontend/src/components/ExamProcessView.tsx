import React from 'react'
import { ArrowLeft, BookOpen, Clock, HelpCircle, Navigation, CheckCircle2, AlertCircle, Save, Award, ExternalLink } from 'lucide-react'

interface ExamProcessViewProps {
  onBack?: () => void
}

export function ExamProcessView({ onBack }: ExamProcessViewProps) {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      window.history.back()
    }
  }

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
      <header style={{
        backgroundColor: '#0b2240',
        color: '#ffffff',
        padding: '1.25rem 2rem',
        boxShadow: '0 4px 12px rgba(11, 34, 64, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleBack}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-serif, Georgia, serif)', color: '#f5d782' }}>
                Bharat Vikas Parishad
              </span>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                Online Exam System Portal & Mobile Application
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
            <BookOpen size={22} style={{ color: '#f2bb50' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5d782' }}>Examination Process Guide</span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{
        flex: 1,
        maxWidth: '1000px',
        width: '100%',
        margin: '2rem auto',
        padding: '0 1.5rem',
        boxSizing: 'border-box'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
          padding: '2.5rem 3rem',
          boxSizing: 'border-box'
        }}>
          {/* Document Header */}
          <div style={{
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <BookOpen size={28} style={{ color: '#0b2240' }} />
              <h1 style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0b2240',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                letterSpacing: '-0.02em'
              }}>
                EXAMINATION PROCESS
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              Comprehensive Guide & Rules for Online Examination Candidates
            </p>
          </div>

          {/* Guide Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.7 }}>
            
            {/* 1. Examination Process */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} style={{ color: '#c59f2d' }} />
                <span>Examination Process</span>
              </h2>
              <p style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.975rem' }}>
                After successfully logging into the Platform, students will be directed to the Dashboard, where all examinations assigned or made available to them by Bharat Vikas Parishad will be displayed.
              </p>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#0b2240', fontSize: '0.925rem' }}>
                  Each examination card displays important information, including:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.925rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.25rem' }}>
                  <li>Examination Name</li>
                  <li>Category</li>
                  <li>Duration of the Examination</li>
                  <li>Total Number of Questions</li>
                  <li>Examination Status</li>
                  <li>Start Exam button</li>
                </ul>
              </div>
              <p style={{ margin: '0.75rem 0 0 0', color: '#475569', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Students should carefully review the examination details before starting the examination.
              </p>
            </section>

            {/* 2. Starting an Examination */}
            <section style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: '#2563eb' }} />
                <span>Starting an Examination</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.975rem', fontWeight: 600 }}>
                To begin an examination, click the <strong>Start Exam</strong> button.
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e3a8a', fontSize: '0.925rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>The examination timer will begin immediately.</li>
                <li>The timer will continue to run until the examination duration expires.</li>
                <li>Students should ensure they have a stable internet connection and sufficient battery before commencing the examination.</li>
              </ul>
            </section>

            {/* 3. Examination Pattern */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} style={{ color: '#c59f2d' }} />
                <span>Examination Pattern</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                The Platform currently supports Multiple Choice Questions (MCQs). Each question contains:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>One Question</li>
                <li>Four (4) Answer Options</li>
                <li>Only one option is correct.</li>
              </ul>
              <p style={{ margin: '0.5rem 0 0 0', color: '#334155', fontSize: '0.95rem', fontWeight: 500 }}>
                Students must select the answer they believe is correct before proceeding to the next question.
              </p>
            </section>

            {/* 4. Question Navigation */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation size={20} style={{ color: '#c59f2d' }} />
                <span>Question Navigation</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Students may navigate through the examination using the provided controls. Navigation options include:
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem' }}>
                <li><strong>Next</strong> – Move to the next question.</li>
                <li><strong>Previous</strong> – Return to the previous question.</li>
              </ul>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>
                Students may freely move between questions during the examination until the examination is submitted or the allotted time expires.
              </p>
            </section>

            {/* 5. Question Status Indicators (TABLE) */}
            <section style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
                <span>Question Status Indicators</span>
              </h2>
              <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.95rem' }}>
                For ease of navigation, the Platform uses colour indicators to display the status of each question.
              </p>

              {/* Status Table */}
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.925rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0b2240', color: '#ffffff' }}>
                      <th style={{ padding: '10px 16px', fontWeight: 700, width: '120px' }}>Colour</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, width: '140px' }}>Status</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Green */}
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f0fdf4' }}>
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#15803d' }}>
                        <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#22c55e', border: '1px solid #15803d' }}></span>
                        🟢 Green
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#166534' }}>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                          Attempted
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#14532d' }}>
                        The question has been answered.
                      </td>
                    </tr>

                    {/* White */}
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#475569' }}>
                        <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ffffff', border: '2px solid #94a3b8' }}></span>
                        ⚪ White
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>
                        <span style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                          Unattempt
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        The question has been visited but no answer has been selected.
                      </td>
                    </tr>

                    {/* Grey */}
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#334155' }}>
                        <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#64748b' }}></span>
                        ⚫ Grey
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#334155' }}>
                        <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                          Not Visited
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        The question has not yet been opened by the student.
                      </td>
                    </tr>

                    {/* Orange */}
                    <tr style={{ backgroundColor: '#fff7ed' }}>
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#c2410c' }}>
                        <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ea580c' }}></span>
                        🟠 Orange
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#c2410c' }}>
                        <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                          Current Question
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#7c2d12' }}>
                        The question currently being displayed on the screen.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p style={{ margin: '1rem 0 0 0', color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' }}>
                These indicators help students quickly identify answered, unanswered and unvisited questions before submitting the examination.
              </p>
            </section>

            {/* 6. Review Before Submission */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} style={{ color: '#c59f2d' }} />
                <span>Review Before Submission</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                Students are encouraged to review all questions before submitting the examination. Using the colour indicators, students can easily identify:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem' }}>
                <li>Questions already answered.</li>
                <li>Questions left unanswered.</li>
                <li>Questions that have not yet been visited.</li>
              </ul>
            </section>

            {/* 7. Submitting the Examination */}
            <section style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
                <span>Submitting the Examination</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#14532d', fontSize: '0.975rem' }}>
                The <strong>Submit</strong> button will be available on the last question of the examination. By clicking Submit, the student confirms that:
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.25rem', color: '#14532d', fontSize: '0.925rem' }}>
                <li>All intended responses have been completed.</li>
                <li>The examination is ready for final submission.</li>
              </ul>
              <p style={{ margin: 0, color: '#dc2626', fontWeight: 700, fontSize: '0.925rem' }}>
                Once submitted, the examination cannot be modified or reopened.
              </p>
            </section>

            {/* 8. Automatic Submission */}
            <section style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#9f1239', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} style={{ color: '#e11d48' }} />
                <span>Automatic Submission</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#881337', fontSize: '0.975rem' }}>
                The examination shall be automatically submitted if:
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.25rem', color: '#881337', fontSize: '0.925rem' }}>
                <li>The allotted examination time expires.</li>
                <li>The student fails to resume the examination before the examination timer ends after logout or internet interruption.</li>
                <li>The examination session ends due to system rules.</li>
              </ul>
              <p style={{ margin: 0, color: '#9f1239', fontWeight: 600, fontSize: '0.9rem' }}>
                After automatic submission, no further changes shall be permitted.
              </p>
            </section>

            {/* 9. Examination Timer */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: '#c59f2d' }} />
                <span>Examination Timer</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.975rem' }}>
                The examination timer starts immediately after clicking Start Exam. The timer continues to run regardless of:
              </p>
              <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.5rem', color: '#334155', fontSize: '0.95rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.25rem' }}>
                <li>Internet interruption</li>
                <li>Application closure</li>
                <li>Device restart</li>
                <li>Student logout</li>
              </ul>
              <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.95rem' }}>
                If the student logs in again before the examination time expires, the examination may be resumed from the last automatically saved progress.
              </p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                If the examination duration has already expired, the examination will already have been submitted automatically and cannot be resumed.
              </p>
            </section>

            {/* 10. Saving Responses */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b2240', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={20} style={{ color: '#c59f2d' }} />
                <span>Saving Responses</span>
              </h2>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.975rem' }}>
                The Platform automatically saves student responses periodically and whenever an answer is selected or changed. This feature is intended to minimize data loss due to accidental interruptions. However, students are advised to maintain a stable internet connection throughout the examination for the best experience.
              </p>
            </section>

            {/* 11. Examination Completion */}
            <section style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#854d0e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} style={{ color: '#ca8a04' }} />
                <span>Examination Completion</span>
              </h2>
              <p style={{ margin: '0 0 0.5rem 0', color: '#713f12', fontSize: '0.975rem' }}>
                Upon successful submission of the examination, and where enabled by Bharat Vikas Parishad, students may immediately access:
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.25rem', color: '#713f12', fontSize: '0.925rem', fontWeight: 600 }}>
                <li>Download Certificate</li>
                <li>Download Answer Sheet</li>
              </ul>
              <p style={{ margin: 0, color: '#854d0e', fontSize: '0.875rem', fontStyle: 'italic' }}>
                Availability of these features depends upon the rules and configuration of the respective examination or programme.
              </p>
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
        © {new Date().getFullYear()} Bharat Vikas Parishad. Powered by <strong>NeoPace Infotech LLP</strong>
      </footer>
    </div>
  )
}
