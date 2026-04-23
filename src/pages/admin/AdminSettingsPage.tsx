import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/supabase'

export default function AdminSettingsPage() {
  const [appName, setAppName] = useState('Construction Cost Estimator')
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [defaultLanguage, setDefaultLanguage] = useState('en')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await db.from('app_settings').select('key, value')
      if (data) {
        data.forEach((setting: any) => {
          if (setting.key === 'app_name') setAppName(setting.value || 'Construction Cost Estimator')
          if (setting.key === 'default_currency') setDefaultCurrency(setting.value || 'USD')
          if (setting.key === 'default_language') setDefaultLanguage(setting.value || 'en')
        })
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const settingsToUpdate = [
      { key: 'app_name', value: appName },
      { key: 'default_currency', value: defaultCurrency },
      { key: 'default_language', value: defaultLanguage }
    ]

    const { error } = await db.from('app_settings').upsert(settingsToUpdate, { onConflict: 'key' })
    if (error) {
      toast.error('Failed to save settings')
      console.error(error)
    } else {
      toast.success('App Settings updated successfully worldwide!')
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center text-surface-muted animate-pulse">Loading global config...</div>

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center gap-2 border-b border-surface-border pb-4">
        <Settings size={28} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">App Settings</h1>
      </div>
      
      <div className="card space-y-5 max-w-2xl">
        <h2 className="font-semibold text-white mb-2">Global Application Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="label">Brand App Name</label>
            <input 
              type="text" 
              className="input w-full" 
              value={appName} 
              onChange={(e) => setAppName(e.target.value)} 
            />
          </div>

          <div>
            <label className="label">Global Default Currency</label>
            <select 
              className="input w-full" 
              value={defaultCurrency} 
              onChange={(e) => setDefaultCurrency(e.target.value)}
            >
              <option value="USD">USD ($) - US Dollar</option>
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
            </select>
          </div>

          <div>
            <label className="label">Global Default UI Language</label>
            <select 
              className="input w-full" 
              value={defaultLanguage} 
              onChange={(e) => setDefaultLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिन्दी)</option>
            </select>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="btn-primary mt-6 !w-auto"
          >
            {saving ? 'Saving Config...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
