import { Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">App Settings</h1>
      </div>
      <div className="card space-y-4">
        <h2 className="font-semibold text-white">General Settings</h2>
        {[
          { label: 'App Name', value: 'Construction Cost Estimator' },
          { label: 'Default Currency', value: 'USD' },
          { label: 'Default Language', value: 'en' },
        ].map(({ label, value }) => (
          <div key={label}>
            <label className="label">{label}</label>
            <input type="text" className="input max-w-sm" defaultValue={value} />
          </div>
        ))}
        <button onClick={() => toast.success('Settings saved')} className="btn-primary">Save Settings</button>
      </div>
    </div>
  )
}
