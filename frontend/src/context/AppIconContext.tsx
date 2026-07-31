import React, { createContext, useContext, useEffect, useState } from 'react'
import defaultIconAsset from '../assets/app_icon.jpeg'
import bvpBkjIconAsset from '../assets/BVP-BKJ_icon.jpeg'

type AppIconKey = 'DEFAULT' | 'BVP_BKJ'

interface AppIconContextType {
  iconKey: AppIconKey
  appIconSrc: string
  refreshAppIcon: () => Promise<void>
  setAppIconLocal: (key: AppIconKey) => void
}

const AppIconContext = createContext<AppIconContextType>({
  iconKey: 'DEFAULT',
  appIconSrc: defaultIconAsset,
  refreshAppIcon: async () => {},
  setAppIconLocal: () => {},
})

export const AppIconProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [iconKey, setIconKey] = useState<AppIconKey>(() => {
    const saved = localStorage.getItem('active_app_icon_key')
    return (saved === 'BVP_BKJ' ? 'BVP_BKJ' : 'DEFAULT') as AppIconKey
  })

  const appIconSrc = iconKey === 'BVP_BKJ' ? bvpBkjIconAsset : defaultIconAsset

  const updateFavicon = (src: string) => {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'shortcut icon'
      document.head.appendChild(link)
    }
    link.href = src
  }

  const fetchActiveIcon = async () => {
    try {
      const res = await fetch('/api/settings/app-icon')
      const data = await res.json()
      if (data.success && data.iconKey) {
        const key = data.iconKey as AppIconKey
        setIconKey(key)
        localStorage.setItem('active_app_icon_key', key)
        updateFavicon(key === 'BVP_BKJ' ? bvpBkjIconAsset : defaultIconAsset)
      }
    } catch (err) {
      console.error('Failed to fetch dynamic app icon:', err)
    }
  }

  useEffect(() => {
    updateFavicon(appIconSrc)
    fetchActiveIcon()
    // Poll every 30 seconds to catch Super-Admin icon triggers in real time
    const interval = setInterval(fetchActiveIcon, 30000)
    return () => clearInterval(interval)
  }, [iconKey])

  const setAppIconLocal = (key: AppIconKey) => {
    setIconKey(key)
    localStorage.setItem('active_app_icon_key', key)
    updateFavicon(key === 'BVP_BKJ' ? bvpBkjIconAsset : defaultIconAsset)
  }

  return (
    <AppIconContext.Provider
      value={{
        iconKey,
        appIconSrc,
        refreshAppIcon: fetchActiveIcon,
        setAppIconLocal,
      }}
    >
      {children}
    </AppIconContext.Provider>
  )
}

export const useAppIcon = () => useContext(AppIconContext)
