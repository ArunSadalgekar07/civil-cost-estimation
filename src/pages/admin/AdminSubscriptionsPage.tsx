import { useEffect, useState } from 'react'
import { CreditCard, Search, X } from 'lucide-react'
import { db } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface MergedSubscription {
  id: string
  user_id: string
  user_name: string
  tier: string
  status: string
  expires_at: string | null
  created_at: string
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<MergedSubscription[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Modal State
  const [selectedSub, setSelectedSub] = useState<MergedSubscription | null>(null)
  const [editTier, setEditTier] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    // Fetch profiles as the base source of truth to ensure we see users even if they lack a formal subscription row!
    const [subsRes, profilesRes] = await Promise.all([
      db.from('subscriptions').select('*'),
      db.from('profiles').select('id, full_name, subscription_tier')
    ])

    const subsData = subsRes.data || []
    const profsData = profilesRes.data || []

    const merged = profsData.map(p => {
      // Find latest subscription for the user
      const matchingSubs = subsData.filter(s => s.user_id === p.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const activeSub = matchingSubs[0]

      return {
        id: activeSub?.id || '',
        user_id: p.id,
        user_name: p.full_name || 'Unnamed User',
        tier: activeSub?.tier || p.subscription_tier || 'free',
        status: activeSub?.status || 'inactive',
        expires_at: activeSub?.expires_at || null,
        created_at: activeSub?.created_at || new Date().toISOString()
      }
    })
    
    setSubs(merged)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpen = (s: MergedSubscription) => {
    setSelectedSub(s)
    setEditTier(s.tier)
    setEditStatus(s.status)
    setEditDate(s.expires_at ? s.expires_at.split('T')[0] : '')
  }

  const handleSave = async () => {
    if (!selectedSub) return
    setSaving(true)
    
    const payload = {
      user_id: selectedSub.user_id,
      tier: editTier,
      status: editStatus,
      expires_at: editDate ? new Date(editDate).toISOString() : null
    }

    try {
      if (selectedSub.id) {
        // Update existing row
        const { error } = await db.from('subscriptions').update(payload).eq('id', selectedSub.id)
        if (error) throw error
      } else {
        // Create formal subscription row for the first time
        const { error } = await db.from('subscriptions').insert([payload])
        if (error) throw error
      }

      // Sync the profile tier to instantly reflect globally for the user
      await db.from('profiles').update({ subscription_tier: editTier }).eq('id', selectedSub.user_id)

      toast.success('Subscription plan successfully updated!')
      setSelectedSub(null)
      fetchData()
    } catch (e: any) {
      toast.error('Operation failed')
      console.error(e)
    }

    setSaving(false)
  }

  const filtered = subs.filter(s => 
    s.user_name.toLowerCase().includes(search.toLowerCase()) || 
    s.user_id.includes(search)
  )

  return (
    <div className="animate-in space-y-6 relative">
      <div className="flex items-center gap-2">
        <CreditCard size={20} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-muted" />
        <input type="text" className="input ps-9" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-surface-muted">No records found.</td></tr>
            ) : filtered.map(s => (
              <tr key={s.user_id}>
                <td className="font-medium">{s.user_name}</td>
                <td className="capitalize">
                  <span className={`badge ${s.tier === 'enterprise' ? 'badge-blue' : s.tier === 'pro' ? 'badge-accent' : 'badge-yellow'}`}>
                    {s.tier}
                  </span>
                </td>
                <td>
                  <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'expired' ? 'badge-red' : 'bg-surface border-surface-border text-surface-muted'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="text-surface-muted">
                  {s.expires_at ? formatDate(s.expires_at) : 'Lifetime / Null'}
                </td>
                <td>
                  <button onClick={() => handleOpen(s)} className="btn btn-ghost p-1 text-xs px-3">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-md shadow-2xl animate-in overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="text-lg font-semibold text-white">Edit Subscription Data</h2>
              <button onClick={() => setSelectedSub(null)} className="btn btn-ghost p-1.5 focus:outline-none hover:bg-surface border-0">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider block mb-1">Target Account</label>
                <div className="p-2 bg-surface rounded text-sm text-white font-medium border border-surface-border">
                  {selectedSub.user_name}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider block mb-1">Plan Configuration</label>
                <select className="input w-full" value={editTier} onChange={e => setEditTier(e.target.value)}>
                  <option value="free">Free Tier</option>
                  <option value="pro">Pro Tier</option>
                  <option value="enterprise">Enterprise Tier</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider block mb-1">Payment / State</label>
                <select className="input w-full" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider block mb-1">Explicit Expiration Date</label>
                <input 
                  type="date" 
                  className="input w-full [color-scheme:dark]" 
                  value={editDate} 
                  onChange={e => setEditDate(e.target.value)} 
                />
                <p className="text-[10px] text-surface-muted mt-1 opacity-70">Leave blank for permanent configurations</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-border bg-surface-card/50">
              <button disabled={saving} onClick={() => setSelectedSub(null)} className="btn-outline text-sm py-2 px-4 shadow-none">Abort</button>
              <button disabled={saving} onClick={handleSave} className="btn-primary text-sm py-2 px-6">
                {saving ? 'Commiting...' : 'Override & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
