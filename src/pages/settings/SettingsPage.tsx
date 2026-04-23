import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { db, supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { User, Globe, Bell, Lock, Database } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, profile, setProfile } = useAuthStore()
  const [activeSection, setActiveSection] = useState('profile')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [lang, setLang] = useState(i18n.language)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // Data Portability States
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleExportData = async () => {
    setExporting(true)
    toast.info('Structuring export payload... Please wait.')
    
    // Fetch all user projects with deeply nested relationships
    const { data, error } = await db.from('projects')
      .select('*, cost_items(*), risks(*), financial_settings(*), project_versions(*)')
      .eq('user_id', user!.id)

    if (error || !data) {
      toast.error('Failed to extract data: ' + (error?.message || 'Unknown error'))
      setExporting(false)
      return
    }

    // Format structure to JSON and trigger Blob download
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `cost_estimator_data_export_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('System export completed successfully!')
    setExporting(false)
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you absolutely sure? This will PERMANENTLY delete your account, all your projects, and all associated structural data. This cannot be undone.')) return
    
    setDeleting(true)
    const { error } = await supabase.rpc('delete_user_account')

    if (error) {
      toast.error('Account deletion failed: ' + error.message)
      setDeleting(false)
    } else {
      toast.success('Account successfully purged. Goodbye.')
      await supabase.auth.signOut()
    }
  }

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password first')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    setUpdatingPassword(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
    }
    setUpdatingPassword(false)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const { error } = await db.from('profiles').update({ full_name: fullName }).eq('id', user!.id)
    if (!error) {
      // Re-fetch profile to strictly sync local state with our backend changes
      const { data } = await db.from('profiles').select('*').eq('id', user!.id).single()
      if (data) setProfile(data)
      toast.success('Profile updated!')
    } else {
      console.error(error)
      toast.error('Failed to update profile')
    }
    setSaving(false)
  }

  const handleLangChange = (newLang: string) => {
    i18n.changeLanguage(newLang)
    setLang(newLang)
    toast.success(`Language changed to ${newLang === 'en' ? 'English' : 'Hindi'}`)
  }

  const sections = [
    { id: 'profile', label: t('settings.profile'), icon: <User size={16} /> },
    { id: 'preferences', label: t('settings.preferences'), icon: <Globe size={16} /> },
    { id: 'notifications', label: t('settings.notifications'), icon: <Bell size={16} /> },
    { id: 'security', label: 'Security', icon: <Lock size={16} /> },
    { id: 'data', label: 'Data Management', icon: <Database size={16} /> },
  ]

  return (
    <div className="animate-in space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>

      <div className="flex gap-6 flex-wrap md:flex-nowrap">
        {/* Section nav */}
        <div className="w-full md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`nav-item w-full ${activeSection === s.id ? 'active' : ''}`}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'profile' && (
            <div className="card space-y-5">
              <h2 className="font-semibold text-white">{t('settings.profile')}</h2>
              <div>
                <label className="label">{t('settings.fullName')}</label>
                <input type="text" className="input max-w-sm" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="label">{t('settings.email')}</label>
                <input type="email" className="input max-w-sm" value={user?.email || ''} readOnly disabled />
              </div>
              <div>
                <label className="label">Subscription Tier</label>
                <span className="badge badge-blue capitalize">{profile?.subscription_tier || 'free'}</span>
              </div>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : t('settings.save')}
              </button>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div className="card space-y-5">
              <h2 className="font-semibold text-white">{t('settings.preferences')}</h2>
              <div>
                <label className="label">{t('settings.language')}</label>
                <div className="flex gap-3">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'हिन्दी' },
                  ].map(l => (
                    <button
                      key={l.code}
                      onClick={() => handleLangChange(l.code)}
                      className={lang === l.code ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-white">{t('settings.notifications')}</h2>
              {[
                { label: 'Email notifications', checked: true },
                { label: 'Project shared notifications', checked: true },
                { label: 'Cost summary reports', checked: false },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked={item.checked} className="accent-accent w-4 h-4" />
                  <span className="text-sm text-white">{item.label}</span>
                </label>
              ))}
            </div>
          )}

          {activeSection === 'security' && (
            <div className="card space-y-5">
              <h2 className="font-semibold text-white">Security</h2>
              <div>
                <label className="label">Current Password</label>
                <input 
                  type="password" 
                  className="input max-w-sm" 
                  placeholder="••••••••" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input 
                  type="password" 
                  className="input max-w-sm" 
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button 
                onClick={handleUpdatePassword} 
                disabled={updatingPassword} 
                className="btn-primary"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-6">
              <div className="card space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-white">Mass Data Export</h2>
                    <p className="text-sm text-surface-muted mt-1">Download a completely offline backup copy of all your created projects, cost tracking models, settings, and histories encapsulated into a portable JSON structure.</p>
                  </div>
                  <Database className="text-accent opacity-50" size={32} />
                </div>
                <button 
                  onClick={handleExportData} 
                  disabled={exporting} 
                  className="btn-outline border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  {exporting ? 'Extracting payload...' : 'Download JSON Platform Backup'}
                </button>
              </div>

              <div className="card border-red-500/20 bg-red-950/20 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-red-500">Danger Zone: Purge Account</h2>
                    <p className="text-sm text-surface-muted mt-1">Execute the Right to be Forgotten protocol. Permanently obliterate this system profile and cascade-delete all connected estimation data instantly.</p>
                  </div>
                </div>
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={deleting} 
                  className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded font-medium text-sm transition-colors"
                >
                  {deleting ? 'Awaiting server...' : 'Permanently Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
