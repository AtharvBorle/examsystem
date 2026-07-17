import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../utils/localization';

export function LanguageSelector({ 
  lang, 
  onChangeLang,
  isDark = true
}: { 
  lang: Language; 
  onChangeLang: (lang: Language) => void;
  isDark?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeBg = isDark ? '#16253b' : '#ffffff';
  const themeText = isDark ? '#ffffff' : '#2c2c2c';
  const themeBorder = isDark ? '#c5a059' : '#b39266';
  const hoverBg = isDark ? 'rgba(197, 160, 89, 0.2)' : '#f4efea';

  return (
    <div ref={dropdownRef} className="custom-lang-selector" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: '6px',
          border: `1px solid ${themeBorder}`,
          backgroundColor: themeBg,
          color: themeText,
          fontSize: '0.85rem',
          fontWeight: '500',
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '70px',
          justifyContent: 'space-between',
        }}
      >
        <span>{lang === 'hi' ? 'HI' : 'EN'}</span>
        <span style={{ fontSize: '0.65rem', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            backgroundColor: themeBg,
            border: `2px solid ${themeBorder}`,
            borderRadius: '8px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
            zIndex: 99999,
            minWidth: '110px',
            overflow: 'hidden',
            animation: 'dropdownFadeIn 0.15s ease-out',
          }}
        >
          <style>
            {`
              @keyframes dropdownFadeIn {
                from { opacity: 0; transform: translateY(-4px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}
          </style>
          <button
            type="button"
            onClick={() => {
              onChangeLang('en');
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              border: 'none',
              backgroundColor: lang === 'en' ? hoverBg : 'transparent',
              color: themeText,
              fontSize: '0.9rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span>English</span>
            {lang === 'en' && <span style={{ color: '#c5a059', fontWeight: 'bold' }}>✓</span>}
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeLang('hi');
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              border: 'none',
              backgroundColor: lang === 'hi' ? hoverBg : 'transparent',
              color: themeText,
              fontSize: '0.9rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span>हिंदी (HI)</span>
            {lang === 'hi' && <span style={{ color: '#c5a059', fontWeight: 'bold' }}>✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
