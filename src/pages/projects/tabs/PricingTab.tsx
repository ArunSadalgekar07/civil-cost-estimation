import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { calculateCostSummary } from '@/lib/calculations'
import { formatCurrency } from '@/lib/utils'
import { useSystemStore } from '@/store/systemStore'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { Settings, Calculator, Building2 } from 'lucide-react'

interface Props { projectId: string }

export default function PricingTab({ projectId }: Props) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { costItems, risks, financialSettings, updateFinancialSettings } = useProjectStore()
  const { currencies } = useSystemStore()
  
  const [settings, setSettings] = useState(financialSettings || {
    id: '', project_id: projectId,
    overhead_pct: 10, contingency_pct: 5, markup_pct: 15, tax_pct: 5, currency: 'USD'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (financialSettings) setSettings(financialSettings)
  }, [financialSettings])

  const isOwner = user?.role === 'admin' || user?.role === 'owner'
  const summary = calculateCostSummary(costItems, settings, risks)

  const handleSave = async () => {
    setSaving(true)
    await updateFinancialSettings(projectId, settings)
    toast.success('Pricing settings saved')
    setSaving(false)
  }

  const sliders = [
    { label: 'Overhead (%)', key: 'overhead_pct', color: 'text-yellow-400' },
    { label: 'Contingency (%)', key: 'contingency_pct', color: 'text-orange-400' },
    { label: 'Markup (%)', key: 'markup_pct', color: 'text-blue-400' },
    { label: 'Tax (%)', key: 'tax_pct', color: 'text-purple-400' },
  ] as const

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card space-y-5">
        <h2 className="text-lg font-semibold text-white">Profit & Pricing Settings</h2>

        <div>
          <label className="label">Currency</label>
          <select
            value={settings.currency}
            onChange={e => setSettings({ ...settings, currency: e.target.value })}
            className="input"
            disabled={!isOwner}
          >
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {sliders.map(({ label, key, color }) => {
           const value = settings[key as keyof typeof settings] as number
           const onChange = (v: number) => setSettings({ ...settings, [key]: v })

           return (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{label}</label>
              <span className={`text-sm font-bold ${color}`}>{value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={value}
              onChange={e => onChange(Number(e.target.value))}
              className="w-full accent-accent"
              disabled={!isOwner}
            />
            <input
              type="number"
              min="0"
              max="50"
              value={value}
              onChange={e => onChange(Number(e.target.value))}
              className="input mt-2 w-28"
              disabled={!isOwner}
            />
          </div>
        )})}

        {isOwner && (
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </div>

      {/* Financial summary */}
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold text-white">Financial Summary</h2>
        {[
          { label: 'Direct Costs', value: summary.directCost, note: 'Materials + Labor + Equipment + Additional', color: 'text-white' },
          { label: 'Overhead', value: summary.overhead, note: `${settings.overhead_pct}% of direct costs`, color: 'text-yellow-400' },
          { label: 'Contingency', value: summary.contingency, note: `${settings.contingency_pct}% + risk contingency`, color: 'text-orange-400' },
          { label: 'Subtotal', value: summary.subtotal, note: '', color: 'text-white font-bold' },
          { label: 'Profit / Markup', value: summary.markup, note: `${settings.markup_pct}% markup`, color: 'text-blue-400' },
          { label: 'Subtotal Before Tax', value: summary.subtotalBeforeTax, note: '', color: 'text-white font-bold' },
          { label: 'Tax', value: summary.tax, note: `${settings.tax_pct}% tax`, color: 'text-purple-400' },
        ].map(({ label, value, note, color }, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-surface border border-surface-border rounded-lg">
            <div>
              <p className={`font-medium ${color}`}>{label}</p>
              {note && <p className="text-xs text-surface-muted">{note}</p>}
            </div>
            <p className="font-mono">{formatCurrency(value, settings.currency)}</p>
          </div>
        ))}
        
        <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-accent font-semibold uppercase tracking-wider text-sm">Selling Price</span>
            <span className="text-2xl font-bold font-mono text-white">{formatCurrency(summary.totalPrice, settings.currency)}</span>
          </div>
          <p className="text-xs text-surface-muted">Final quoted price including all provisions</p>
        </div>
      </div>
    </div>
  )
}
