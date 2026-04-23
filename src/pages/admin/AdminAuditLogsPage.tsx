import { useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<{ 
    id: string; action: string; entity_type: string; created_at: string;
    profiles?: { full_name: string; role?: string; id: string; }
  }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: logsData, error } = await db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
      if (error || !logsData) {
        setLoading(false)
        return
      }

      const userIds = [...new Set(logsData.map(l => l.user_id).filter(Boolean))]
      let profilesMap: Record<string, { full_name: string; role?: string; id: string; }> = {}

      if (userIds.length > 0) {
        // Only select available schema fields to prevent hard crashes
        const { data: profilesData } = await db.from('profiles').select('id, full_name, role').in('id', userIds)
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
        }
      }

      const merged = logsData.map(log => ({
        ...log,
        profiles: log.user_id ? profilesMap[log.user_id] : undefined
      }))

      setLogs(merged as typeof logs)
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-surface-muted">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-surface-muted">No audit logs found.</td></tr>
            ) : logs.map(log => (
              <tr key={log.id}>
                <td>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{log.profiles?.full_name || 'System User'}</span>
                    <span className="text-xs text-surface-muted">{log.profiles?.id?.substring(0, 8)}...</span>
                  </div>
                </td>
                <td><span className="badge badge-blue">{log.action}</span></td>
                <td className="text-surface-muted">{log.entity_type}</td>
                <td className="text-surface-muted">{formatDate(log.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
