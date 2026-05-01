import { useState, useEffect, useMemo } from 'react'
import { X, Search, Lock } from 'lucide-react'
import { db } from '@/lib/supabase'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import { cn, DEFAULT_CURRENCY, formatCurrency, getCurrencyRate } from '@/lib/utils'
import { toast } from 'sonner'
import type { CostItem, CostCategory, Resource } from '@/types'

type LibraryResource = Pick<Resource, 'id' | 'name' | 'description' | 'unit' | 'unit_price' | 'currency'> & {
  profiles?: {
    role?: 'admin' | 'user'
  } | null
}

interface Props {
  projectId: string
  category: CostCategory
  item?: CostItem | null
  onClose: () => void
}

export default function CostItemFormModal({ projectId, category, item, onClose }: Props) {
  const { createCostItem, updateCostItem, financialSettings } = useProjectStore()
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin'
  const [loading, setLoading] = useState(false)
  const [libraryItems, setLibraryItems] = useState<LibraryResource[]>([])
  const [searchLibrary, setSearchLibrary] = useState('')
  const [showLibrary, setShowLibrary] = useState(false)
  const [selectedLibraryItemId, setSelectedLibraryItemId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: item?.name || '',
    quantity: item?.quantity?.toString() || '',
    unit: item?.unit || '',
    unit_price: item?.unit_price?.toString() || '',
    workers: item?.workers?.toString() || '',
    daily_rate: item?.daily_rate?.toString() || '',
    days: item?.days?.toString() || '',
    rental_cost: item?.rental_cost?.toString() || '',
    maintenance: item?.maintenance?.toString() || '',
    fuel: item?.fuel?.toString() || '',
    notes: item?.notes || '',
  })

  useEffect(() => {
    const fetchLibrary = async () => {
      const { data, error } = await db.from('resources')
        .select(`
          *,
          profiles:user_id (
            role
          )
        `)
        .eq('category', category)

      if (error) {
        console.error('Library fetch error:', error)
        const { data: simpleData } = await db.from('resources').select('*').eq('category', category)
        setLibraryItems((simpleData || []) as LibraryResource[])
      } else {
        const filtered = ((data || []) as LibraryResource[]).filter((resource) => isAdmin || resource.profiles?.role === 'admin')
        setLibraryItems(filtered)
      }

      if (!isAdmin && !item) {
        setShowLibrary(true)
      }
    }

    fetchLibrary()
  }, [category, isAdmin, item])

  const filteredLibrary = useMemo(() => {
    return libraryItems.filter((libraryItem) =>
      libraryItem.name.toLowerCase().includes(searchLibrary.toLowerCase())
    )
  }, [libraryItems, searchLibrary])

  const hasValidLibrarySelection = useMemo(() => {
    if (isAdmin) return true
    if (selectedLibraryItemId) return true
    if (!item) return false

    return libraryItems.some((libraryItem) =>
      libraryItem.name === form.name &&
      (libraryItem.unit || '') === form.unit &&
      String(libraryItem.unit_price ?? 0) === String(form.unit_price || '0')
    )
  }, [form.name, form.unit, form.unit_price, isAdmin, item, libraryItems, selectedLibraryItemId])

  const handleSelectLibraryItem = async (selectedItem: LibraryResource) => {
    setSelectedLibraryItemId(selectedItem.id)
    const projectCurrency = financialSettings?.currency || DEFAULT_CURRENCY
    const resourceCurrency = selectedItem.currency || DEFAULT_CURRENCY
    const { rate } = await getCurrencyRate(resourceCurrency, projectCurrency)
    const convertedUnitPrice = (selectedItem.unit_price || 0) * rate
    setForm((currentForm) => ({
      ...currentForm,
      name: selectedItem.name,
      unit: selectedItem.unit || '',
      unit_price: convertedUnitPrice.toFixed(2),
      notes: selectedItem.description || ''
    }))
    setShowLibrary(false)
    toast.success(`${selectedItem.name} selected from library`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!isAdmin && !hasValidLibrarySelection) {
      toast.error('Users must pick an item from the admin library.')
      setShowLibrary(true)
      return
    }

    setLoading(true)

    const data: Partial<CostItem> = {
      project_id: projectId,
      category,
      name: form.name,
      notes: form.notes || null,
      quantity: form.quantity ? Number(form.quantity) : null,
      unit: form.unit || null,
      unit_price: form.unit_price ? Number(form.unit_price) : null,
      workers: form.workers ? Number(form.workers) : null,
      daily_rate: form.daily_rate ? Number(form.daily_rate) : null,
      days: form.days ? Number(form.days) : null,
      rental_cost: form.rental_cost ? Number(form.rental_cost) : null,
      maintenance: form.maintenance ? Number(form.maintenance) : null,
      fuel: form.fuel ? Number(form.fuel) : null,
    }

    if (item) {
      await updateCostItem(item.id, data)
      toast.success('Item updated')
    } else {
      await createCostItem(data)
      toast.success('Item added')
    }

    setLoading(false)
    onClose()
  }

  const categoryLabel: Record<CostCategory, string> = {
    materials: 'Material',
    labor: 'Labor',
    equipment: 'Equipment',
    additional: 'Additional Cost'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl animate-in">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h2 className="font-semibold text-white">{item ? 'Edit' : 'Add'} {categoryLabel[category]}</h2>
          <button onClick={onClose} className="btn btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Name *</label>
              <button
                type="button"
                onClick={() => setShowLibrary(!showLibrary)}
                className="text-xs text-accent flex items-center gap-1 hover:underline"
              >
                <Search size={10} /> {isAdmin ? 'Search from Library' : 'Pick from Admin Library'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                className={cn('input', !isAdmin && 'bg-surface/50 cursor-not-allowed')}
                value={form.name}
                onChange={(e) => {
                  if (!isAdmin) return
                  setSelectedLibraryItemId(null)
                  setForm((currentForm) => ({ ...currentForm, name: e.target.value }))
                }}
                required
                placeholder={isAdmin ? 'Item name' : 'Please pick from library'}
                readOnly={!isAdmin}
              />
              {!isAdmin && <Lock size={12} className="absolute end-3 top-1/2 -translate-y-1/2 text-surface-muted opacity-50" />}
            </div>

            {showLibrary && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden animate-in">
                <div className="p-2 border-b border-surface-border">
                  <div className="relative">
                    <Search size={12} className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-muted" />
                    <input
                      type="text"
                      autoFocus
                      className="input input-sm ps-8 h-8 rounded-lg"
                      placeholder="Search library..."
                      value={searchLibrary}
                      onChange={(e) => setSearchLibrary(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredLibrary.length === 0 ? (
                    <div className="p-4 text-center text-xs text-surface-muted">No matching items in library.</div>
                  ) : filteredLibrary.map((lib) => (
                    <button
                      key={lib.id}
                      type="button"
                      onClick={() => handleSelectLibraryItem(lib)}
                      className="w-full text-start p-3 hover:bg-white/5 border-b border-surface-border last:border-0 transition-colors"
                    >
                      <div className="font-medium text-white text-sm">{lib.name}</div>
                      <div className="text-[10px] text-surface-muted flex gap-2">
                        {lib.unit && <span>Unit: {lib.unit}</span>}
                        {lib.unit_price > 0 && <span>Price: {formatCurrency(lib.unit_price, lib.currency || DEFAULT_CURRENCY)}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {category === 'materials' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Quantity</label>
                <input type="number" className="input" value={form.quantity} onChange={(e) => setForm((currentForm) => ({ ...currentForm, quantity: e.target.value }))} placeholder="0" min="0" />
              </div>
              <div>
                <label className="label">Unit</label>
                <div className="relative">
                  <input
                    type="text"
                    className={cn('input', !isAdmin && 'bg-surface/50 cursor-not-allowed')}
                    value={form.unit}
                    onChange={(e) => {
                      if (!isAdmin) return
                      setSelectedLibraryItemId(null)
                      setForm((currentForm) => ({ ...currentForm, unit: e.target.value }))
                    }}
                    placeholder="m3, kg, bag"
                    readOnly={!isAdmin}
                  />
                  {!isAdmin && <Lock size={12} className="absolute end-3 top-1/2 -translate-y-1/2 text-surface-muted opacity-50" />}
                </div>
              </div>
              <div>
                <label className="label">Unit Price</label>
                <div className="relative">
                  <input
                    type="number"
                    className={cn('input', !isAdmin && 'bg-surface/50 cursor-not-allowed')}
                    value={form.unit_price}
                    onChange={(e) => {
                      if (!isAdmin) return
                      setSelectedLibraryItemId(null)
                      setForm((currentForm) => ({ ...currentForm, unit_price: e.target.value }))
                    }}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    readOnly={!isAdmin}
                  />
                  {!isAdmin && <Lock size={12} className="absolute end-3 top-1/2 -translate-y-1/2 text-surface-muted opacity-50" />}
                </div>
              </div>
            </div>
          )}

          {category === 'labor' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Workers</label>
                <input type="number" className="input" value={form.workers} onChange={(e) => setForm((currentForm) => ({ ...currentForm, workers: e.target.value }))} placeholder="0" min="0" />
              </div>
              <div>
                <label className="label">Daily Rate</label>
                <input type="number" className="input" value={form.daily_rate} onChange={(e) => setForm((currentForm) => ({ ...currentForm, daily_rate: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className="label">Days</label>
                <input type="number" className="input" value={form.days} onChange={(e) => setForm((currentForm) => ({ ...currentForm, days: e.target.value }))} placeholder="0" min="0" />
              </div>
            </div>
          )}

          {category === 'equipment' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Rental Cost</label>
                <input type="number" className="input" value={form.rental_cost} onChange={(e) => setForm((currentForm) => ({ ...currentForm, rental_cost: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className="label">Maintenance</label>
                <input type="number" className="input" value={form.maintenance} onChange={(e) => setForm((currentForm) => ({ ...currentForm, maintenance: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className="label">Fuel</label>
                <input type="number" className="input" value={form.fuel} onChange={(e) => setForm((currentForm) => ({ ...currentForm, fuel: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
          )}

          {category === 'additional' && (
            <div>
              <label className="label">Amount</label>
              <input type="number" className="input" value={form.unit_price} onChange={(e) => setForm((currentForm) => ({ ...currentForm, unit_price: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => setForm((currentForm) => ({ ...currentForm, notes: e.target.value }))} placeholder="Optional notes..." />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-border">
          <button onClick={onClose} className="btn-outline btn-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary btn-sm">
            {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {item ? 'Update' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
