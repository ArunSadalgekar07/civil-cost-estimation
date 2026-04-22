import { useState } from 'react'
import { X, Copy, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateShareToken } from '@/lib/utils'
import type { Project } from '@/types'

interface Props {
  project: Project
  onClose: () => void
}

export default function ShareModal({ project, onClose }: Props) {
  const [token] = useState(() => generateShareToken())
  const [copied, setCopied] = useState(false)
  const [password, setPassword] = useState('')
  const [expiry, setExpiry] = useState('7d')

  const shareUrl = `${window.location.origin}/share/${token}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl animate-in">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-accent" />
            <h2 className="font-semibold text-white">Share Project</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-surface-muted">Share <strong className="text-white">{project.name}</strong> with others using a secure link.</p>

          {/* Generated link */}
          <div>
            <label className="label">Share Link</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="input text-xs flex-1"
              />
              <button onClick={copyLink} className="btn-primary btn-sm px-3">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label">Password Protection (optional)</label>
            <input
              type="password"
              className="input"
              placeholder="Leave empty for public access"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="label">Link Expires In</label>
            <select className="input" value={expiry} onChange={e => setExpiry(e.target.value)}>
              <option value="1d">1 Day</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="">Never expires</option>
            </select>
          </div>

          <button className="btn-primary w-full" onClick={() => { toast.success('Share link generated!') }}>
            Generate & Save Link
          </button>

          <div className="border-t border-surface-border pt-4">
            <p className="text-sm font-medium text-white mb-3">Internal Sharing</p>
            <div className="flex gap-2">
              <input type="email" className="input flex-1" placeholder="Invite by email..." />
              <select className="input w-28">
                <option>View</option>
                <option>Edit</option>
              </select>
              <button className="btn-outline btn-sm">Invite</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-5 border-t border-surface-border">
          <button onClick={onClose} className="btn-outline">Close</button>
        </div>
      </div>
    </div>
  )
}
