import React, { useState } from 'react'
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Search, Mail, Phone, ExternalLink } from 'lucide-react'

interface FaqViewProps {
  onBack?: () => void
}

interface FaqItem {
  id: number
  question: string
  answer: React.ReactNode
  category: 'General' | 'Registration' | 'Exam' | 'Technical' | 'Account'
}

export function FaqView({ onBack }: FaqViewProps) {
  const [openId, setOpenId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      window.history.back()
    }
  }

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  const faqs: FaqItem[] = [
    {
      id: 1,
      category: 'Registration',
      question: '1. How do I register for the Online Exam System?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>To register, enter your:</p>
          <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.25rem' }}>
            <li>First Name & Last Name</li>
            <li>Father's Name & Mother's Name</li>
            <li>School Name and Class</li>
            <li>Mobile Number and verify with OTP</li>
          </ul>
          <p style={{ margin: 0 }}>
            Search for your school by <strong>School Name</strong> or <strong>UDISE Number</strong>. After selecting your school, your Tehsil and District will be filled automatically. Verify your mobile number using the OTP to complete registration. You will be logged in immediately after successful verification.
          </p>
        </div>
      )
    },
    {
      id: 2,
      category: 'Registration',
      question: '2. Can I register more than once using the same mobile number?',
      answer: (
        <p style={{ margin: 0 }}>
          No. Each mobile number is unique and can be used to register only one student account. Duplicate registrations using the same mobile number are not permitted. Each student should register only once for fairness in the exam.
        </p>
      )
    },
    {
      id: 3,
      category: 'General',
      question: '3. How do I log in after registration?',
      answer: (
        <p style={{ margin: 0 }}>
          Simply enter your registered mobile number. You will be logged into your existing account. There is no need to register again or any verification if account already exists.
        </p>
      )
    },
    {
      id: 4,
      category: 'Registration',
      question: '4. How do I find my school?',
      answer: (
        <p style={{ margin: 0 }}>
          You can search for your school by <strong>School Name</strong> or <strong>UDISE Number</strong>. After selecting the correct school, the corresponding Tehsil and District will automatically appear.
        </p>
      )
    },
    {
      id: 5,
      category: 'Exam',
      question: '5. What information is displayed before starting an examination?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>After logging in, you will see all examinations assigned to you. Each examination displays:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>Examination Name</li>
            <li>Category</li>
            <li>Duration</li>
            <li>Total Number of Questions</li>
            <li>Start Exam button</li>
          </ul>
        </div>
      )
    },
    {
      id: 6,
      category: 'Exam',
      question: '6. How do I start an examination?',
      answer: (
        <p style={{ margin: 0 }}>
          Click the <strong>Start Exam</strong> button displayed on the examination card. The examination timer will begin immediately after the examination starts.
        </p>
      )
    },
    {
      id: 7,
      category: 'Exam',
      question: '7. What type of questions are asked?',
      answer: (
        <p style={{ margin: 0 }}>
          The examination consists of Multiple Choice Questions (MCQs). Each question has four options, and only one option is correct.
        </p>
      )
    },
    {
      id: 8,
      category: 'Exam',
      question: '8. Can I move between questions during the examination?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. You may navigate through the examination using the <strong>Next</strong> and <strong>Previous</strong> buttons and jump directly to a specific question by clicking on its question number, until the examination is submitted or the examination time expires.
        </p>
      )
    },
    {
      id: 9,
      category: 'Exam',
      question: '9. What do the question colours mean?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.75rem 0' }}>
            These colours help you track your progress during the examination:
          </p>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0b2240', color: '#ffffff' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Colour</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#15803d' }}>🟢 Green</td>
                  <td style={{ padding: '8px 12px' }}>Question Attempted</td>
                </tr>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>⚪ White</td>
                  <td style={{ padding: '8px 12px' }}>Visited but Not Attempted</td>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>⚫ Grey</td>
                  <td style={{ padding: '8px 12px' }}>Not Visited</td>
                </tr>
                <tr style={{ backgroundColor: '#fff7ed' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#c2410c' }}>🟠 Orange</td>
                  <td style={{ padding: '8px 12px' }}>Current Question</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 10,
      category: 'Exam',
      question: '10. Where is the Submit button?',
      answer: (
        <p style={{ margin: 0 }}>
          The <strong>Submit</strong> button is available on the last question of the examination. You may review all questions before submitting on the review page.
        </p>
      )
    },
    {
      id: 11,
      category: 'Technical',
      question: '11. Will my answers be saved automatically?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. The Platform automatically saves your responses while you are taking the examination to reduce the risk of data loss.
        </p>
      )
    },
    {
      id: 12,
      category: 'Technical',
      question: '12. What happens if my internet connection is lost?',
      answer: (
        <p style={{ margin: 0 }}>
          If your internet connection is interrupted, your examination progress remains saved automatically. The examination timer will continue to run, and you may resume the examination after logging in again, provided that the examination time has not expired.
        </p>
      )
    },
    {
      id: 13,
      category: 'Technical',
      question: '13. What happens if I accidentally log out during the examination?',
      answer: (
        <p style={{ margin: 0 }}>
          You can log back in using your registered mobile number and continue the examination from your last saved progress, provided there is still time remaining. If the examination duration has expired, the examination will be automatically submitted.
        </p>
      )
    },
    {
      id: 14,
      category: 'Technical',
      question: '14. Does the examination timer stop if I close the application?',
      answer: (
        <p style={{ margin: 0 }}>
          No. Once the examination starts, the timer continues to run even if you close the application, log out, restart your device, or lose internet connectivity.
        </p>
      )
    },
    {
      id: 15,
      category: 'Exam',
      question: '15. When is my examination automatically submitted?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>The examination will be automatically submitted if:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>The examination duration expires.</li>
            <li>You do not resume the examination before the allotted time ends.</li>
            <li>The examination session ends according to the system rules.</li>
          </ul>
        </div>
      )
    },
    {
      id: 16,
      category: 'Account',
      question: '16. Can I change my personal information?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. You may update your personal information, such as your name, through the Edit Profile section. Certain examination-related information may not be editable after participation in an examination.
        </p>
      )
    },
    {
      id: 17,
      category: 'Registration',
      question: '17. Can I change my registered school after registration?',
      answer: (
        <p style={{ margin: 0 }}>
          Changes to the registered school may not be permitted once the examination process has begun. If you have selected the wrong school, please contact the programme coordinator or support before starting the examination.
        </p>
      )
    },
    {
      id: 18,
      category: 'General',
      question: '18. When will I receive my certificate?',
      answer: (
        <p style={{ margin: 0 }}>
          Where enabled for the programme, your Certificate Download button will become available immediately after the successful completion of the examination.
        </p>
      )
    },
    {
      id: 19,
      category: 'General',
      question: '19. Can I download my answer sheet?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. If enabled by Bharat Vikas Parishad, an Answer Sheet Download button will also be available after the examination has been completed.
        </p>
      )
    },
    {
      id: 20,
      category: 'General',
      question: '20. Where can I access study materials?',
      answer: (
        <p style={{ margin: 0 }}>
          Students can access study materials through the Resources section of the application. This section may include learning materials, guidelines, reference documents and other educational content published by Bharat Vikas Parishad.
        </p>
      )
    },
    {
      id: 21,
      category: 'Account',
      question: '21. How can I delete my account?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>You may request account deletion in either of the following ways:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>Tap <strong>Settings → Delete Account</strong> within the application.</li>
            <li>Send an email to <a href="mailto:info@neopaceinfotech.com" style={{ color: '#2563eb' }}>info@neopaceinfotech.com</a> with your registered mobile number and account details.</li>
          </ul>
        </div>
      )
    },
    {
      id: 22,
      category: 'Account',
      question: '22. What happens after I request account deletion?',
      answer: (
        <p style={{ margin: 0 }}>
          Your account will be placed in a soft-deleted state for 30 days. During this period, your account may be restored upon request and successful verification. After 30 days, the account may be permanently deleted or anonymized in accordance with applicable laws and operational requirements.
        </p>
      )
    },
    {
      id: 23,
      category: 'Technical',
      question: '23. Is my personal information secure?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. Appropriate technical and organizational security measures are implemented to protect your personal information. Data is processed on behalf of Bharat Vikas Parishad in accordance with applicable laws and the Platform's Privacy Policy.
        </p>
      )
    },
    {
      id: 24,
      category: 'Technical',
      question: '24. Who should I contact if I face a technical issue?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>For technical assistance, please contact NeoPace Infotech LLP:</p>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#2563eb' }}>
            📧 <a href="mailto:info@neopaceinfotech.com" style={{ color: '#2563eb', textDecoration: 'none' }}>info@neopaceinfotech.com</a>
          </p>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>When reporting an issue, please include:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#475569' }}>
            <li>Full Name</li>
            <li>Registered Mobile Number</li>
            <li>School Name</li>
            <li>Screenshot (if available)</li>
            <li>Description of the issue</li>
          </ul>
        </div>
      )
    },
    {
      id: 25,
      category: 'General',
      question: '25. Who owns and operates the Platform?',
      answer: (
        <p style={{ margin: 0 }}>
          The Online Exam System is owned and administered by <strong>Bharat Vikas Parishad</strong>. The Platform is developed, hosted, deployed, managed, maintained and technically operated by <strong>NeoPace Infotech LLP</strong> on behalf of Bharat Vikas Parishad.
        </p>
      )
    }
  ]

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
            <HelpCircle size={22} style={{ color: '#f2bb50' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5d782' }}>Frequently Asked Questions</span>
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
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <HelpCircle size={28} style={{ color: '#0b2240' }} />
              <h1 style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0b2240',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                letterSpacing: '-0.02em'
              }}>
                FREQUENTLY ASKED QUESTIONS (FAQs)
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              Find quick answers to common queries regarding registration, examinations, certificates, and technical support.
            </p>
          </div>

          {/* Search Box */}
          <div style={{
            position: 'relative',
            marginBottom: '2rem'
          }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text"
              placeholder="Search FAQs by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                fontSize: '0.95rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0b2240')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
            />
          </div>

          {/* FAQ Accordion List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id || searchTerm.trim().length > 0
              return (
                <div 
                  key={faq.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: isOpen ? '#ffffff' : '#f8fafc',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    style={{
                      width: '100%',
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      outline: 'none'
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0b2240', paddingRight: '1rem' }}>
                      {faq.question}
                    </span>
                    <div style={{
                      backgroundColor: isOpen ? '#0b2240' : '#e2e8f0',
                      color: isOpen ? '#ffffff' : '#64748b',
                      borderRadius: '50%',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 1.25rem 1.25rem 1.25rem',
                      fontSize: '0.95rem',
                      color: '#334155',
                      lineHeight: 1.65,
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      <div style={{ marginTop: '0.75rem' }}>
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
