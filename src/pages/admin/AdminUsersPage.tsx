import { useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { Users, Search, Trash2, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'

interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string | null
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editRole, setEditRole] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db
        .from('profiles')
        .select('id, full_name, email, role, created_at')

      setUsers((data || []) as UserProfile[])
      setLoading(false)
    }
    fetch()
  }, [])

  const handleOpenUser = (user: UserProfile) => {
    setSelectedUser(user)
    setEditRole(user.role || 'user')
  }

  const handleUpdate = async () => {
    if (!selectedUser) return
    setUpdating(true)

    const { error } = await db
      .from('profiles')
      .update({ role: editRole })
      .eq('id', selectedUser.id)

    if (error) {
      toast.error('Failed to update user')
      console.error(error)
    } else {
      toast.success('User updated successfully')
      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...user, role: editRole } : user
      ))
      setSelectedUser(null)
    }
    setUpdating(false)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    if (userToDelete.id === currentUser?.id) {
      toast.error('You cannot delete your own admin account here.')
      setUserToDelete(null)
      return
    }

    setDeleting(true)
    const { error } = await db.rpc('admin_delete_user', { target_user_id: userToDelete.id })

    if (error) {
      toast.error('Failed to delete user: ' + error.message)
      console.error(error)
    } else {
      toast.success('User deleted successfully')
      setUsers(users.filter(user => user.id !== userToDelete.id))
      if (selectedUser?.id === userToDelete.id) setSelectedUser(null)
      setUserToDelete(null)
    }
    setDeleting(false)
  }

  const filtered = users.filter(user =>
    `${user.full_name || ''} ${user.email || ''}`.toLowerCase().includes(search.toLowerCase())
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
              <th>Email</th>
              <th>Role</th>
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
            ) : filtered.map(user => (
              <tr key={user.id}>
                <td className="font-medium">{user.full_name || 'Unnamed User'}</td>
                <td className="text-surface-muted">{user.email || '-'}</td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td className="text-surface-muted">{user.created_at ? formatDate(user.created_at) : '-'}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenUser(user)} className="btn btn-ghost p-1 text-xs px-3">View</button>
                    <button
                      onClick={() => setUserToDelete(user)}
                      disabled={user.id === currentUser?.id}
                      className="btn btn-ghost p-1.5 hover:text-danger disabled:opacity-40 disabled:cursor-not-allowed"
                      title={user.id === currentUser?.id ? 'You cannot delete your own account' : 'Delete user'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-md shadow-2xl animate-in overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="text-lg font-semibold text-white">Manage User</h2>
              <button onClick={() => setSelectedUser(null)} className="btn btn-ghost p-1.5 focus:outline-none hover:bg-surface border-0">
                <X size={18} />
              </button>
            </div>

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
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider mb-1 block">Email</label>
                <div className="text-white font-medium">{selectedUser.email || '-'}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-muted uppercase tracking-wider mb-1 block">Role Level</label>
                <select className="input w-full" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="user">Standard User (user)</option>
                  <option value="admin">System Admin (admin)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-border bg-surface-card/50">
              <button disabled={updating} onClick={() => setSelectedUser(null)} className="btn-outline text-sm py-2 px-4">Cancel</button>
              <button disabled={updating} onClick={handleUpdate} className="btn-primary text-sm py-2 px-6">
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <DeleteConfirmModal
          title="Delete User"
          message={`Delete ${userToDelete.full_name || userToDelete.email || 'this user'} and all data connected to their account? This cannot be undone.`}
          onCancel={() => !deleting && setUserToDelete(null)}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  )
}
