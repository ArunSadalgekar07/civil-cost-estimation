import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { toast } from 'sonner'
import type { CostItem, CostCategory } from '@/types'

interface Props {
  projectId: string
  category: CostCategory
  item?: CostItem | null
  onClose: () => void
}

export default function CostItemFormModal({ projectId, category, item, onClose }: Props) {
  const { createCostItem, updateCostItem } = useProjectStore()
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
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
    materials: 'Material', labor: 'Labor', equipment: 'Equipment', additional: 'Additional Cost'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl animate-in">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h2 className="font-semibold text-white">{item ? 'Edit' : 'Add'} {categoryLabel[category]}</h2>
          <button onClick={onClose} className="btn btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Item name" />
          </div>

          {category === 'materials' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Quantity</label>
                <input type="number" className="input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" min="0" />
              </div>
              <div>
                <label className="label">Unit</label>
                <input type="text" className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="m³, kg, bag" />
              </div>
              <div>
                <label className="label">Unit Price</label>
                <input type="number" className="input" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
          )}

          {category === 'labor' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Workers</label>
                <input type="number" className="input" value={form.workers} onChange={e => setForm(f => ({ ...f, workers: e.target.value }))} placeholder="0" min="0" />
              </div>
              <div>
                <label className="label">Daily Rate</label>
                <input type="number" className="input" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className="label">Days</label>
                <input type="number" className="input" value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} placeholder="0" min="0" />
              </div>
            </div>
          )}

          {category === 'equipment' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Rental Cost</label>
                <input type="number" className="input" value={form.rental_cost} onChange={e => setForm(f => ({ ...f, rental_cost: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className="label">Maintenance</label>
                <input type="number" className="input" value={form.maintenance} onChange={e => setForm(f => ({ ...f, maintenance: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className="label">Fuel</label>
                <input type="number" className="input" value={form.fuel} onChange={e => setForm(f => ({ ...f, fuel: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
          )}

          {category === 'additional' && (
            <div>
              <label className="label">Amount</label>
              <input type="number" className="input" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
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
