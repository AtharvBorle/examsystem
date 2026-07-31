import React from 'react'

/**
 * KeyDown handler to prevent typing negative signs (-), plus (+), 'e', 'E', 
 * and prevent entering 0 as the leading/first character.
 */
export const handlePositiveNumberKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  allowDecimal = false
) => {
  const invalidChars = ['-', '+', 'e', 'E']
  if (!allowDecimal) {
    invalidChars.push('.')
  }
  if (invalidChars.includes(e.key)) {
    e.preventDefault()
    return
  }
  // Prevent entering '0' if the field is currently empty or selection is at start
  const input = e.currentTarget
  if (e.key === '0' && (input.value === '' || input.selectionStart === 0)) {
    e.preventDefault()
  }
}

/**
 * Sanitizes typed/pasted string so negative values (-), e/E, and leading zeros are stripped out,
 * ensuring only values >= 1 (or positive decimals) remain.
 */
export const sanitizePositiveNumber = (val: string, allowDecimal = false): string => {
  if (!val) return ''
  // Strip minus, plus, e, E
  let clean = val.replace(/[-+eE]/g, '')
  if (!allowDecimal) {
    clean = clean.replace(/\./g, '')
  }
  // Strip leading zeros e.g. "05" -> "5", "0" -> ""
  clean = clean.replace(/^0+/, '')
  return clean
}
