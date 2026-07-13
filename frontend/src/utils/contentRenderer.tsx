import React from 'react'

export const isImageStr = (str: string): boolean => {
  if (!str) return false
  const s = str.trim()
  return s.startsWith('data:image/') || /^https?:\/\//i.test(s)
}

export const renderContent = (val: string, style?: React.CSSProperties) => {
  if (!val) return null
  if (isImageStr(val)) {
    return (
      <img 
        src={val.trim()} 
        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain', display: 'block', borderRadius: '4px', margin: '0.25rem 0', ...style }} 
        alt="Image content" 
      />
    )
  }
  return <span>{val}</span>
}
