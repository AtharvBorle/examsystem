import React, { createContext, useContext } from 'react'
import defaultIconAsset from '../assets/app_icon.jpeg'

interface AppIconContextType {
  appIconSrc: string
}

const AppIconContext = createContext<AppIconContextType>({
  appIconSrc: defaultIconAsset,
})

export const AppIconProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppIconContext.Provider value={{ appIconSrc: defaultIconAsset }}>
      {children}
    </AppIconContext.Provider>
  )
}

export const useAppIcon = () => useContext(AppIconContext)
