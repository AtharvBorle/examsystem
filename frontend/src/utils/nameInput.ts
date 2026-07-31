import React from 'react'

/**
 * KeyDown handler to prevent typing digits (0-9) in name fields.
 */
export const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Block digits 0-9 (main keyboard and numpad)
  if (/^[0-9]$/.test(e.key)) {
    e.preventDefault()
  }
}

/**
 * Sanitizes input string to remove all digits (0-9 and Devanagari digits ०-९).
 * Retains letters (English, Hindi, Devanagari), spaces, dots, hyphens, and single quotes.
 */
export const sanitizeName = (val: string): string => {
  if (!val) return ''
  return val.replace(/[0-9०-९]/g, '')
}
