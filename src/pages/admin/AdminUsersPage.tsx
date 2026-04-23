import { useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { Users, Search, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  full_name: string | null
  role: string | null
  subscription_tier: string | null
  created_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [updating, setUpdating] = useState(false)
  
  // Edit form states
  const [editRole, setEditRole] = useState('')
  const [editTier, setEditTier] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db
        .from('profiles')
        .select('id, full_name, role, subscription_tier, created_at')
      
      const typed = (data || []) as UserProfile[]
      setUsers(typed)
      setLoading(false)
    }
    fetch()
  }, [])

  const handleOpenUser = (u: UserProfile) => {
    setSelectedUser(u)
    setEditRole(u.role || 'user')
    setEditTier(u.subscription_tier || 'free')
  }

  const handleUpdate = async () => {
    if (!selectedUser) return
    setUpdating(true)
    
    const { error } = await db
      .from('profiles')
      .update({ role: editRole, subscription_tier: editTier })
      .eq('id', selectedUser.id)

    if (error) {
      toast.error('Failed to update user')
      console.error(error)
    } else {
      toast.success('User updated successfully')
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, role: editRole, subscription_tier: editTier } 
          : u
      ))
      setSelectedUser(null)
    }
    setUpdating(false)
  }

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-in space-y-6 relative">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Users</h1>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-muted" />
        <input type="text" className="input ps-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-surface-muted">No users found.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td className="font-medium">{u.full_name || 'Unnamed User'}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>
                    {u.role || 'user'}
                  </span>
                </td>
                <td>
                  <span className="badge badge-yellow capitalize">{u.subscription_tier || 'free'}</span>
                </td>
                <td className="text-surface-muted">{u.created_at ? formatDate(u.created_at) : '—'}</td>
                <td>
                  <button onClick={() => handleOpenUser(u)} className="btn btn-ghost p-1 text-xs px-3">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Editing Modal Overlay */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-md shadow-2xl animate-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="text-lg font-semibold text-white">Manage User</h2>
              <button onClick={() => setSelectedUser(null)} className="btn btn-ghost p-1.5 focus:outline-none hover:bg-surface border-0">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider">User ID</label>
                <div className="mt-1 p-2 bg-surface rounded text-xs font-mono text-surface-muted select-all">
                  {selectedUser.id}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider mb-1 block">Full Name</label>
                <div className="text-white font-medium">{selectedUser.full_name || 'Unnamed User'}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider mb-1 block">Role Level</label>
                <select className="input w-full" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="user">Standard User (user)</option>
                  <option value="admin">System Admin (admin)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider mb-1 block">Subscription Tier</label>
                <select className="input w-full" value={editTier} onChange={e => setEditTier(e.target.value)}>
                  <option value="free">Free Tier</option>
                  <option value="pro">Pro Tier</option>
                  <option value="enterprise">Enterprise Tier</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-border bg-surface-card/50">
              <button disabled={updating} onClick={() => setSelectedUser(null)} className="btn-outline text-sm py-2 px-4">Cancel</button>
              <button disabled={updating} onClick={handleUpdate} className="btn-primary text-sm py-2 px-6">
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
