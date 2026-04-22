import { useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<{ id: string; action: string; entity_type: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
      setLogs((data || []) as typeof logs)
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
              <th>Action</th>
              <th>Entity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center py-8 text-surface-muted">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-surface-muted">No audit logs found.</td></tr>
            ) : logs.map(log => (
              <tr key={log.id}>
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
