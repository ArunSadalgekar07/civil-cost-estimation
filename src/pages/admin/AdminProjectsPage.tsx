import { useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { FolderOpen, Search, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface MergedProject {
  id: string
  name: string
  user_name: string
  type: string | null
  location: string | null
  status: string
  created_at: string
}

export default function AdminProjectsPage() {
  const [projectsList, setProjectsList] = useState<MergedProject[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchGlobalProjects = async () => {
    setLoading(true)
    
    // We execute both fetch blocks in parallel. Because of our RLS Admin bypass,
    // this will pull EVERY project in the entire application!
    const [projectsRes, profilesRes] = await Promise.all([
      db.from('projects').select('id, name, user_id, type, location, status, created_at'),
      db.from('profiles').select('id, full_name')
    ])

    const projectsData = projectsRes.data || []
    const profilesData = profilesRes.data || []

    const merged = projectsData.map(proj => {
      const owner = profilesData.find(p => p.id === proj.user_id)
      return {
        id: proj.id,
        name: proj.name,
        type: proj.type,
        location: proj.location,
        status: proj.status,
        created_at: proj.created_at,
        user_name: owner?.full_name || 'Anonymous'
      }
    })

    // Sort by newest globally
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setProjectsList(merged)
    setLoading(false)
  }

  useEffect(() => {
    fetchGlobalProjects()
  }, [])

  const filtered = projectsList.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.user_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen size={20} className="text-accent" />
          <h1 className="text-2xl font-bold text-white">Global Projects</h1>
        </div>
        <div className="text-sm font-medium text-surface-muted bg-surface py-1.5 px-4 rounded-full border border-surface-border">
          {projectsList.length} total across network
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-muted" />
        <input 
          type="text" 
          className="input ps-9" 
          placeholder="Filter by Project or Architect name..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Project Title</th>
              <th>Owner / Architect</th>
              <th>Type</th>
              <th>Location</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-surface-muted">No projects found on network.</td></tr>
            ) : filtered.map(p => (
              <tr 
                key={p.id} 
                onClick={() => navigate(`/projects/${p.id}`)}
                className="cursor-pointer hover:bg-white/5 transition-colors group"
              >
                <td className="font-medium text-white group-hover:text-accent transition-colors">
                  <div className="flex items-center gap-2">
                    {p.name}
                  </div>
                </td>
                <td className="text-surface-muted">{p.user_name}</td>
                <td>
                  <span className="badge badge-blue">
                    {p.type || 'Undefined'}
                  </span>
                </td>
                <td className="text-surface-muted max-w-[150px] truncate">
                  {p.location || '—'}
                </td>
                <td className="capitalize">
                  <span className={`badge ${
                    p.status === 'active' ? 'badge-green' : 
                    p.status === 'completed' ? 'badge-blue' : 
                    p.status === 'archived' ? 'badge-red' : 
                    'badge-yellow'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="text-surface-muted flex items-center justify-between">
                  {formatDate(p.created_at)}
                  <ArrowRight size={16} className="text-surface-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
