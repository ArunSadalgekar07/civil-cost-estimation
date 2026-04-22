import { useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { Users, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-in space-y-6">
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
                  <button className="btn btn-ghost p-1 text-xs">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
