import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Plus, Search, Pencil, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Resource } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'

type ResourceCategory = 'materials' | 'labor' | 'equipment' | 'assemblies'
const TABS: { id: ResourceCategory; label: string }[] = [
  { id: 'materials', label: 'Materials' },
  { id: 'labor', label: 'Labor' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'assemblies', label: 'Assemblies' },
]

export default function ResourcesPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<ResourceCategory>('materials')
  const [resources, setResources] = useState<Resource[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Resource | null>(null)
  const [form, setForm] = useState({ name: '', description: '', unit: '', unit_price: '' })
  const [saving, setSaving] = useState(false)

  const fetchResources = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await db
      .from('resources')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', activeTab)
      .order('created_at', { ascending: false })
    setResources((data || []) as Resource[])
    setLoading(false)
  }

  useEffect(() => { fetchResources() }, [activeTab, user])

  const filtered = resources.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const payload = {
      user_id: user!.id,
      category: activeTab,
      name: form.name,
      description: form.description || null,
      unit: form.unit || null,
      unit_price: Number(form.unit_price) || 0,
      currency: 'USD',
    }
    if (editItem) {
      await db.from('resources').update(payload).eq('id', editItem.id)
      toast.success('Resource updated')
    } else {
      await db.from('resources').insert([payload])
      toast.success('Resource added')
    }
    setSaving(false)
    setShowForm(false)
    setEditItem(null)
    setForm({ name: '', description: '', unit: '', unit_price: '' })
    fetchResources()
  }

  const handleDelete = async (id: string) => {
    await db.from('resources').delete().eq('id', id)
    toast.success('Resource deleted')
    fetchResources()
  }

  const handleEdit = (r: Resource) => {
    setEditItem(r)
    setForm({ name: r.name, description: r.description || '', unit: r.unit || '', unit_price: r.unit_price.toString() })
    setShowForm(true)
  }

  return (
    <div className="animate-in space-y-6">
      <div className="text-sm text-surface-muted">
        {t('common.home')} › <span className="text-white font-medium">{t('resources.title')}</span>
      </div>

      <h1 className="text-2xl font-bold text-white">{t('resources.title')}</h1>

      <div className="tab-list">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch('') }}
            className={cn('tab-item', activeTab === tab.id && 'active')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-white">{TABS.find(t => t.id === activeTab)?.label}</h2>
        <button
          onClick={() => { setEditItem(null); setForm({ name: '', description: '', unit: '', unit_price: '' }); setShowForm(true) }}
          className="btn-primary btn-sm"
        >
          <Plus size={14} /> {t('resources.add')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-muted" />
        <input type="text" className="input ps-9" placeholder={t('resources.search')} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <p className="text-sm text-surface-muted">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" className="accent-accent" /></th>
                <th>{t('resources.name')}</th>
                <th>{t('resources.description')}</th>
                <th>{t('resources.unit')}</th>
                <th>{t('resources.unitPrice')} (USD)</th>
                <th>{t('resources.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-surface-muted">{t('resources.noItems')}</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td><input type="checkbox" className="accent-accent" /></td>
                  <td className="font-medium">{r.name}</td>
                  <td className="text-surface-muted text-sm">{r.description || <span className="italic opacity-50">No description</span>}</td>
                  <td>{r.unit || '—'}</td>
                  <td>{formatCurrency(r.unit_price, 'USD')}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toast.info('Duplicated!')} className="btn btn-ghost p-1" title="Duplicate"><Copy size={13} /></button>
                      <button onClick={() => handleEdit(r)} className="btn btn-ghost p-1" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(r.id)} className="btn btn-ghost p-1 hover:text-danger" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-semibold text-white">{editItem ? 'Edit' : 'Add'} Resource</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Amran Cement Bag" />
              </div>
              <div>
                <label className="label">Description</label>
                <input type="text" className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unit</label>
                  <input type="text" className="input" placeholder="kg, m², bag, ton" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Unit Price (USD)</label>
                  <input type="number" className="input" min="0" step="0.01" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-surface-border">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : (editItem ? 'Update' : 'Add Resource')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
