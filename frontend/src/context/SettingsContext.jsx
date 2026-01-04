import { createContext, useContext, useState, useEffect } from 'react'
import { publicAPI } from '../services/api'

const SettingsContext = createContext()

export const useSettings = () => {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchSettings = async () => {
        try {
            const response = await publicAPI.getSettings()
            setSettings(response.data)
            setError(null)
        } catch (err) {
            console.error('Failed to load global settings:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const updateSettingsLocal = (newSettings) => {
        setSettings(newSettings)
    }

    return (
        <SettingsContext.Provider value={{ settings, loading, error, refetchSettings: fetchSettings, updateSettingsLocal }}>
            {children}
        </SettingsContext.Provider>
    )
}
