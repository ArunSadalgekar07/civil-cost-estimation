import { useParams } from 'react-router-dom'
import { Lock, ExternalLink } from 'lucide-react'

export default function ShareViewPage() {
  const { token } = useParams<{ token: string }>()

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={22} className="text-accent" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Shared Project</h1>
        <p className="text-surface-muted text-sm mb-6">
          Token: <code className="text-accent text-xs">{token?.slice(0, 20)}...</code>
        </p>
        <p className="text-surface-muted text-sm">
          This is a secure share view. Enter the password below if required.
        </p>
        <input type="password" className="input mt-4" placeholder="Enter password (if required)" />
        <button className="btn-primary w-full mt-4">
          <ExternalLink size={16} /> View Project
        </button>
      </div>
    </div>
  )
}
