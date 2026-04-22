import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { db, supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { User, Globe, Bell, Lock } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, profile, setProfile } = useAuthStore()
  const [activeSection, setActiveSection] = useState('profile')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [lang, setLang] = useState(i18n.language)

  // Security States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

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
        </div>
      </div>
    </div>
  )
}
