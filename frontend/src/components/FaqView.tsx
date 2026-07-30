import React, { useState, useEffect } from 'react'
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Search, Mail, Phone, ExternalLink } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { Language } from '../utils/localization'

interface FaqViewProps {
  onBack?: () => void
  lang?: Language
  onChangeLang?: (lang: Language) => void
}

interface FaqItem {
  id: number
  question: string
  questionHi?: string
  answer: React.ReactNode
  answerHi?: React.ReactNode
  category: 'General' | 'Registration' | 'Exam' | 'Technical' | 'Account'
}

export function FaqView({ onBack, lang = 'en', onChangeLang }: FaqViewProps) {
  const [openId, setOpenId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [localLang, setLocalLang] = useState<Language>(lang)

  useEffect(() => {
    setLocalLang(lang)
  }, [lang])

  const currentLang = localLang
  const handleLangChange = (newLang: Language) => {
    setLocalLang(newLang)
    if (onChangeLang) onChangeLang(newLang)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      window.history.pushState({}, '', '/oes/')
      window.dispatchEvent(new PopStateEvent('popstate'))
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
      questionHi: '1. मैं ऑनलाइन परीक्षा प्रणाली के लिए पंजीकरण कैसे करूं?',
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
      ),
      answerHi: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>पंजीकरण करने के लिए, निम्न जानकारी दर्ज करें:</p>
          <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.25rem' }}>
            <li>प्रथम नाम और अंतिम नाम</li>
            <li>पिता का नाम और माता का नाम</li>
            <li>स्कूल का नाम और कक्षा</li>
            <li>मोबाइल नंबर और ओटीपी सत्यापित करें</li>
          </ul>
          <p style={{ margin: 0 }}>
            अपने स्कूल को <strong>स्कूल का नाम</strong> या <strong>UDISE नंबर</strong> द्वारा खोजें। स्कूल चुनने के बाद आपकी तहसील और जिला स्वतः भर जाएंगे। पंजीकरण पूरा करने के लिए अपने मोबाइल नंबर को ओटीपी द्वारा सत्यापित करें। सफल सत्यापन के तुरंत बाद आप लॉगिन हो जाएंगे।
          </p>
        </div>
      )
    },
    {
      id: 2,
      category: 'Registration',
      question: '2. Can I register more than once using the same mobile number?',
      questionHi: '2. क्या मैं एक ही मोबाइल नंबर से एक से अधिक बार पंजीकरण कर सकता हूं?',
      answer: (
        <p style={{ margin: 0 }}>
          No. Each mobile number is unique and can be used to register only one student account. Duplicate registrations using the same mobile number are not permitted. Each student should register only once for fairness in the exam.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          नहीं। प्रत्येक मोबाइल नंबर अद्वितीय है और इसका उपयोग केवल एक छात्र खाता पंजीकृत करने के लिए किया जा सकता है। एक ही मोबाइल नंबर का उपयोग करके दोबारा पंजीकरण करने की अनुमति नहीं है।
        </p>
      )
    },
    {
      id: 3,
      category: 'General',
      question: '3. How do I log in after registration?',
      questionHi: '3. पंजीकरण के बाद मैं दोबारा लॉगिन कैसे करूं?',
      answer: (
        <p style={{ margin: 0 }}>
          Simply enter your registered mobile number. You will be logged into your existing account. There is no need to register again or any verification if account already exists.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          बस अपना पंजीकृत मोबाइल number दर्ज करें। आप सीधे अपने मौजूदा खाते में लॉगिन हो जाएंगे। यदि खाता पहले से मौजूद है तो दोबारा पंजीकरण करने की आवश्यकता नहीं है।
        </p>
      )
    },
    {
      id: 4,
      category: 'Registration',
      question: '4. How do I find my school?',
      questionHi: '4. मैं अपना स्कूल कैसे खोजूं?',
      answer: (
        <p style={{ margin: 0 }}>
          You can search for your school by <strong>School Name</strong> or <strong>UDISE Number</strong>. After selecting the correct school, the corresponding Tehsil and District will automatically appear.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          आप अपने स्कूल को <strong>स्कूल के नाम</strong> या <strong>UDISE नंबर</strong> द्वारा खोज सकते हैं। सही स्कूल चुनने के बाद, संबंधित तहसील और जिला स्वतः दिखाई देंगे।
        </p>
      )
    },
    {
      id: 5,
      category: 'Exam',
      question: '5. What information is displayed before starting an examination?',
      questionHi: '5. परीक्षा शुरू करने से पहले क्या जानकारी प्रदर्शित होती है?',
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
      ),
      answerHi: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>लॉगिन करने के बाद, आपको आपको सौंपी गई सभी परीक्षाएं दिखाई देंगी। प्रत्येक परीक्षा कार्ड पर निम्नलिखित जानकारी दिखाई देगी:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>परीक्षा का नाम</li>
            <li>श्रेणी</li>
            <li>कुल समयावधि</li>
            <li>प्रश्नों की कुल संख्या</li>
            <li>Start Exam (परीक्षा शुरू करें) बटन</li>
          </ul>
        </div>
      )
    },
    {
      id: 6,
      category: 'Exam',
      question: '6. How do I start an examination?',
      questionHi: '6. मैं परीक्षा कैसे शुरू करूं?',
      answer: (
        <p style={{ margin: 0 }}>
          Click the <strong>Start Exam</strong> button displayed on the examination card. The examination timer will begin immediately after the examination starts.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          परीक्षा कार्ड पर प्रदर्शित <strong>Start Exam</strong> बटन पर क्लिक करें। परीक्षा शुरू होते ही टाइमर तुरंत चलना शुरू हो जाएगा।
        </p>
      )
    },
    {
      id: 7,
      category: 'Exam',
      question: '7. What type of questions are asked?',
      questionHi: '7. किस प्रकार के प्रश्न पूछे जाते हैं?',
      answer: (
        <p style={{ margin: 0 }}>
          The examination consists of Multiple Choice Questions (MCQs). Each question has four options, and only one option is correct.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          परीक्षा में बहुविकल्पीय प्रश्न (MCQs) होते हैं। प्रत्येक प्रश्न के चार विकल्प होते हैं, और केवल एक ही विकल्प सही होता है।
        </p>
      )
    },
    {
      id: 8,
      category: 'Exam',
      question: '8. Can I move between questions during the examination?',
      questionHi: '8. क्या मैं परीक्षा के दौरान प्रश्नों के बीच आ-जा सकता हूं?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. You may navigate through the examination using the <strong>Next</strong> and <strong>Previous</strong> buttons and jump directly to a specific question by clicking on its question number, until the examination is submitted or the examination time expires.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          हां। आप <strong>Next</strong> (अगला) और <strong>Previous</strong> (पिछला) बटन का उपयोग करके तथा प्रश्न संख्या पर क्लिक करके किसी भी प्रश्न पर सीधे जा सकते हैं।
        </p>
      )
    },
    {
      id: 9,
      category: 'Exam',
      question: '9. What do the question colours mean?',
      questionHi: '9. प्रश्नों के रंगों का क्या अर्थ है?',
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
      ),
      answerHi: (
        <div>
          <p style={{ margin: '0 0 0.75rem 0' }}>
            ये रंग परीक्षा के दौरान आपकी उत्तर स्थिति को दर्शाते हैं:
          </p>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0b2240', color: '#ffffff' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>रंग (Colour)</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>अर्थ (Meaning)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#15803d' }}>🟢 हरा (Green)</td>
                  <td style={{ padding: '8px 12px' }}>उत्तर दिया गया (Attempted)</td>
                </tr>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>⚪ सफेद (White)</td>
                  <td style={{ padding: '8px 12px' }}>देखा गया लेकिन उत्तर नहीं दिया (Visited Not Attempted)</td>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>⚫ ग्रे (Grey)</td>
                  <td style={{ padding: '8px 12px' }}>नहीं देखा गया (Not Visited)</td>
                </tr>
                <tr style={{ backgroundColor: '#fff7ed' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#c2410c' }}>🟠 नारंगी (Orange)</td>
                  <td style={{ padding: '8px 12px' }}>वर्तमान प्रश्न (Current Question)</td>
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
      questionHi: '10. सबमिट बटन कहां उपलब्ध है?',
      answer: (
        <p style={{ margin: 0 }}>
          The <strong>Submit</strong> button is available on the last question of the examination. You may review all questions before submitting on the review page.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          <strong>Submit</strong> बटन परीक्षा के अंतिम प्रश्न पर उपलब्ध है। आप सबमिट करने से पहले रिव्यू पेज पर सभी प्रश्नों की समीक्षा कर सकते हैं।
        </p>
      )
    },
    {
      id: 11,
      category: 'Technical',
      question: '11. Will my answers be saved automatically?',
      questionHi: '11. क्या मेरे उत्तर स्वचालित रूप से सुरक्षित होंगे?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. The Platform automatically saves your responses while you are taking the examination to reduce the risk of data loss.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          हां। प्लेटफॉर्म डेटा हानि के जोखिम को कम करने के लिए आपके उत्तरों को स्वचालित रूप से सहेजता (Auto-Save) रहता है।
        </p>
      )
    },
    {
      id: 12,
      category: 'Technical',
      question: '12. What happens if my internet connection is lost?',
      questionHi: '12. यदि मेरा इंटरनेट कनेक्शन टूट जाए तो क्या होगा?',
      answer: (
        <p style={{ margin: 0 }}>
          If your internet connection is interrupted, your examination progress remains saved automatically. The examination timer will continue to run, and you may resume the examination after logging in again, provided that the examination time has not expired.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          यदि इंटरनेट में रुकावट आती है, तो भी आपकी परीक्षा प्रगति स्वतः सुरक्षित रहती है। टाइमर चलता रहेगा, और आप दोबारा लॉगिन करके अपनी परीक्षा वहीं से शुरू कर सकते हैं।
        </p>
      )
    },
    {
      id: 13,
      category: 'Technical',
      question: '13. What happens if I accidentally log out during the examination?',
      questionHi: '13. यदि मैं परीक्षा के दौरान गलती से लॉगआउट हो जाता हूं तो क्या होगा?',
      answer: (
        <p style={{ margin: 0 }}>
          You can log back in using your registered mobile number and continue the examination from your last saved progress, provided there is still time remaining. If the examination duration has expired, the examination will be automatically submitted.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          आप अपने पंजीकृत मोबाइल नंबर से दोबारा लॉगिन कर सकते हैं और समय बचा होने पर अपनी परीक्षा अंतिम सहेजी गई प्रगति से जारी रख सकते हैं।
        </p>
      )
    },
    {
      id: 14,
      category: 'Technical',
      question: '14. Does the examination timer stop if I close the application?',
      questionHi: '14. क्या ऐप बंद करने पर परीक्षा का टाइमर रुक जाता है?',
      answer: (
        <p style={{ margin: 0 }}>
          No. Once the examination starts, the timer continues to run even if you close the application, log out, restart your device, or lose internet connectivity.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          नहीं। परीक्षा शुरू होने के बाद, यदि आप ऐप बंद करते हैं, लॉगआउट करते हैं, या इंटरनेट खो देते हैं, तो भी टाइमर लगातार चलता रहता है।
        </p>
      )
    },
    {
      id: 15,
      category: 'Exam',
      question: '15. When is my examination automatically submitted?',
      questionHi: '15. मेरी परीक्षा अपने आप कब सबमिट हो जाती है?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>The examination will be automatically submitted if:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>The examination duration expires.</li>
            <li>You do not resume the examination before the allotted time ends.</li>
            <li>The examination session ends according to the system rules.</li>
          </ul>
        </div>
      ),
      answerHi: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>परीक्षा स्वतः सबमिट हो जाएगी यदि:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>परीक्षा की निर्धारित समयावधि समाप्त हो जाती है।</li>
            <li>आवंटित समय समाप्त होने से पहले आप परीक्षा फिर से शुरू नहीं करते हैं।</li>
          </ul>
        </div>
      )
    },
    {
      id: 16,
      category: 'Account',
      question: '16. Can I change my personal information?',
      questionHi: '16. क्या मैं अपनी व्यक्तिगत जानकारी बदल सकता हूं?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. You may update your personal information, such as your name, through the Edit Profile section. Certain examination-related information may not be editable after participation in an examination.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          हां। आप प्रोफाइल एडिट सेक्शन के माध्यम से अपनी व्यक्तिगत जानकारी अपडेट कर सकते हैं।
        </p>
      )
    },
    {
      id: 17,
      category: 'Registration',
      question: '17. Can I change my registered school after registration?',
      questionHi: '17. क्या मैं पंजीकरण के बाद अपना पंजीकृत स्कूल बदल सकता हूं?',
      answer: (
        <p style={{ margin: 0 }}>
          Changes to the registered school may not be permitted once the examination process has begun. If you have selected the wrong school, please contact the programme coordinator or support before starting the examination.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          परीक्षा प्रक्रिया शुरू होने के बाद स्कूल में बदलाव की अनुमति नहीं दी जा सकती। यदि आपने गलत स्कूल चुना है, तो परीक्षा शुरू करने से पहले सहायता टीम से संपर्क करें।
        </p>
      )
    },
    {
      id: 18,
      category: 'General',
      question: '18. When will I receive my certificate?',
      questionHi: '18. मुझे अपना प्रमाणपत्र कब मिलेगा?',
      answer: (
        <p style={{ margin: 0 }}>
          Where enabled for the programme, your Certificate Download button will become available immediately after the successful completion of the examination.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          परीक्षा सफलतापूर्वक पूर्ण करने के तुरंत बाद प्रमाणपत्र डाउनलोड बटन उपलब्ध हो जाता है।
        </p>
      )
    },
    {
      id: 19,
      category: 'General',
      question: '19. Can I download my answer sheet?',
      questionHi: '19. क्या मैं अपनी उत्तर पुस्तिका डाउनलोड कर सकता हूं?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. If enabled by Bharat Vikas Parishad, an Answer Sheet Download button will also be available after the examination has been completed.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          हां। भारत विकास परिषद द्वारा सक्षम किए जाने पर, परीक्षा पूर्ण होने के बाद उत्तर पुस्तिका (Answer Sheet) डाउनलोड बटन उपलब्ध रहेगा।
        </p>
      )
    },
    {
      id: 20,
      category: 'General',
      question: '20. Where can I access study materials?',
      questionHi: '20. मैं अध्ययन सामग्री कहां प्राप्त कर सकता हूं?',
      answer: (
        <p style={{ margin: 0 }}>
          Students can access study materials through the Resources section of the application. This section may include learning materials, guidelines, reference documents and other educational content published by Bharat Vikas Parishad.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          छात्र ऐप के रिसोर्सेज (Resources) अनुभाग के माध्यम से भारत विकास परिषद द्वारा प्रकाशित अध्ययन सामग्री प्राप्त कर सकते हैं।
        </p>
      )
    },
    {
      id: 21,
      category: 'Account',
      question: '21. How can I delete my account?',
      questionHi: '21. मैं अपना खाता कैसे हटा (Delete) सकता हूं?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>You may request account deletion in either of the following ways:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>Tap <strong>Settings → Delete Account</strong> within the application.</li>
            <li>Send an email to <a href="mailto:info@neopaceinfotech.com" style={{ color: '#2563eb' }}>info@neopaceinfotech.com</a> with your registered mobile number and account details.</li>
          </ul>
        </div>
      ),
      answerHi: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>आप निम्न में से किसी भी तरीके से खाता हटाने का अनुरोध कर सकते हैं:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>ऐप के भीतर <strong>सेटिंग्स → खाता हटाएं (Delete Account)</strong> पर टैप करें।</li>
            <li>अपने पंजीकृत मोबाइल नंबर के साथ <a href="mailto:info@neopaceinfotech.com" style={{ color: '#2563eb' }}>info@neopaceinfotech.com</a> पर ईमेल भेजें।</li>
          </ul>
        </div>
      )
    },
    {
      id: 22,
      category: 'Account',
      question: '22. What happens after I request account deletion?',
      questionHi: '22. खाता हटाने के अनुरोध के बाद क्या होता है?',
      answer: (
        <p style={{ margin: 0 }}>
          Your account will be placed in a soft-deleted state for 30 days. During this period, your account may be restored upon request and successful verification. After 30 days, the account may be permanently deleted or anonymized in accordance with applicable laws and operational requirements.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          आपका खाता 30 दिनों के लिए निष्क्रयावस्था में रहेगा। 30 दिनों के बाद लागू नियमों के अनुसार स्थायी रूप से हटा दिया जाएगा।
        </p>
      )
    },
    {
      id: 23,
      category: 'Technical',
      question: '23. Is my personal information secure?',
      questionHi: '23. क्या मेरी व्यक्तिगत जानकारी सुरक्षित है?',
      answer: (
        <p style={{ margin: 0 }}>
          Yes. Appropriate technical and organizational security measures are implemented to protect your personal information. Data is processed on behalf of Bharat Vikas Parishad in accordance with applicable laws and the Platform's Privacy Policy.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          हां। आपकी व्यक्तिगत जानकारी की सुरक्षा के लिए उपयुक्त तकनीकी और संगठनात्मक सुरक्षा उपाय लागू किए गए हैं।
        </p>
      )
    },
    {
      id: 24,
      category: 'Technical',
      question: '24. Who should I contact if I face a technical issue?',
      questionHi: '24. तकनीकी समस्या होने पर मुझे किससे संपर्क करना चाहिए?',
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
      ),
      answerHi: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0' }}>तकनीकी सहायता के लिए नियॉपेस इंफोटेक एलएलपी से संपर्क करें:</p>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#2563eb' }}>
            📧 <a href="mailto:info@neopaceinfotech.com" style={{ color: '#2563eb', textDecoration: 'none' }}>info@neopaceinfotech.com</a>
          </p>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>समस्या की रिपोर्ट करते समय, कृपया शामिल करें:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#475569' }}>
            <li>पूरा नाम</li>
            <li>पंजीकृत मोबाइल नंबर</li>
            <li>स्कूल का नाम</li>
            <li>स्क्रीनशॉट (यदि उपलब्ध हो)</li>
            <li>समस्या का विवरण</li>
          </ul>
        </div>
      )
    },
    {
      id: 25,
      category: 'General',
      question: '25. Who owns and operates the Platform?',
      questionHi: '25. इस प्लेटफॉर्म का स्वामित्व किसके पास है?',
      answer: (
        <p style={{ margin: 0 }}>
          The Online Exam System is owned and administered by <strong>Bharat Vikas Parishad</strong>. The Platform is developed, hosted, deployed, managed, maintained and technically operated by <strong>NeoPace Infotech LLP</strong> on behalf of Bharat Vikas Parishad.
        </p>
      ),
      answerHi: (
        <p style={{ margin: 0 }}>
          ऑनलाइन परीक्षा प्रणाली का स्वामित्व <strong>भारत विकास परिषद</strong> के पास है। प्लेटफॉर्म का विकास और तकनीकी संचालन <strong>NeoPace Infotech LLP</strong> द्वारा किया जाता है।
        </p>
      )
    }
  ]

  const isHi = currentLang === 'hi'

  const filteredFaqs = faqs.filter(faq => {
    const term = searchTerm.toLowerCase()
    const matchEn = faq.question.toLowerCase().includes(term) || (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(term))
    const matchHi = faq.questionHi ? faq.questionHi.toLowerCase().includes(term) : false
    return matchEn || matchHi
  })

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
              <span>{currentLang === 'hi' ? 'वापस' : 'Back'}</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-serif, Georgia, serif)', color: '#f5d782' }}>
                {currentLang === 'hi' ? 'भारत विकास परिषद' : 'Bharat Vikas Parishad'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                {currentLang === 'hi' ? 'ऑनलाइन परीक्षा प्रणाली एवं मोबाइल ऐप' : 'Online Exam System Portal & Mobile Application'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
              <HelpCircle size={22} style={{ color: '#f2bb50' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5d782' }}>
                {currentLang === 'hi' ? 'सामान्य प्रश्न (FAQs)' : 'Frequently Asked Questions'}
              </span>
            </div>
            <LanguageSelector lang={currentLang} onChangeLang={handleLangChange} isDark={true} />
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
                {isHi ? 'सामान्य प्रश्नोत्तर (FAQs)' : 'FREQUENTLY ASKED QUESTIONS (FAQs)'}
              </h1>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              {isHi 
                ? 'पंजीकरण, परीक्षा, प्रमाणपत्र और तकनीकी सहायता से संबंधित सामान्य प्रश्नों के त्वरित उत्तर प्राप्त करें।'
                : 'Find quick answers to common queries regarding registration, examinations, certificates, and technical support.'}
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
              placeholder={isHi ? 'कीवर्ड द्वारा प्रश्न खोजें...' : 'Search FAQs by keyword...'}
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
              const displayQuestion = isHi && faq.questionHi ? faq.questionHi : faq.question
              const displayAnswer = isHi && faq.answerHi ? faq.answerHi : faq.answer
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
                      {displayQuestion}
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
                        {displayAnswer}
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
