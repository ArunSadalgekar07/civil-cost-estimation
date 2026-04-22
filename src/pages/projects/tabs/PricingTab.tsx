import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { calculateCostSummary } from '@/lib/calculations'
import { formatCurrency, CURRENCIES } from '@/lib/utils'
import { toast } from 'sonner'

interface Props { projectId: string }

export default function PricingTab({ projectId }: Props) {
  const { costItems, risks, financialSettings, updateFinancialSettings } = useProjectStore()

  const settings = financialSettings || {
    id: '', project_id: projectId,
    overhead_pct: 10, contingency_pct: 5, markup_pct: 15, tax_pct: 5, currency: 'USD'
  }

  const [overhead, setOverhead] = useState(settings.overhead_pct)
  const [contingency, setContingency] = useState(settings.contingency_pct)
  const [markup, setMarkup] = useState(settings.markup_pct)
  const [tax, setTax] = useState(settings.tax_pct)
  const [currency, setCurrency] = useState(settings.currency)
  const [saving, setSaving] = useState(false)

  const currentSettings = { ...settings, overhead_pct: overhead, contingency_pct: contingency, markup_pct: markup, tax_pct: tax, currency }
  const summary = calculateCostSummary(costItems, currentSettings, risks)

  const handleSave = async () => {
    setSaving(true)
    await updateFinancialSettings(projectId, currentSettings)
    toast.success('Pricing settings saved')
    setSaving(false)
  }

  const sliders = [
    { label: 'Overhead (%)', value: overhead, onChange: setOverhead, color: 'text-yellow-400' },
    { label: 'Contingency (%)', value: contingency, onChange: setContingency, color: 'text-orange-400' },
    { label: 'Markup (%)', value: markup, onChange: setMarkup, color: 'text-blue-400' },
    { label: 'Tax (%)', value: tax, onChange: setTax, color: 'text-purple-400' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Settings panel */}
      <div className="card space-y-5">
        <h2 className="text-lg font-semibold text-white">Profit & Pricing Settings</h2>

        {/* Currency */}
        <div>
          <label className="label">Currency</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="input"
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Sliders */}
        {sliders.map(({ label, value, onChange, color }) => (
          <div key={label}>
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
            />
            <input
              type="number"
              min="0"
              max="50"
              value={value}
              onChange={e => onChange(Number(e.target.value))}
              className="input mt-2 w-28"
            />
          </div>
        ))}

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Financial summary */}
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold text-white">Financial Summary</h2>
        {[
          { label: 'Direct Costs', value: summary.directCost, note: 'Materials + Labor + Equipment + Additional', color: 'text-white' },
          { label: 'Overhead', value: summary.overhead, note: `${overhead}% of direct costs`, color: 'text-yellow-400' },
          { label: 'Contingency', value: summary.contingency, note: `${contingency}% + risk contingency`, color: 'text-orange-400' },
          { label: 'Subtotal', value: summary.subtotal, note: '', color: 'text-white font-bold' },
          { label: 'Markup', value: summary.markup, note: `${markup}% of subtotal`, color: 'text-blue-400' },
          { label: 'Tax', value: summary.tax, note: `${tax}% of (subtotal + markup)`, color: 'text-purple-400' },
        ].map(({ label, value, note, color }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-surface-border/50 last:border-0">
            <div>
              <p className={`text-sm ${color}`}>{label}</p>
              {note && <p className="text-xs text-surface-muted">{note}</p>}
            </div>
            <span className={`text-sm font-medium ${color}`}>{formatCurrency(value, currency)}</span>
          </div>
        ))}

        <div className="pt-3 border-t-2 border-accent/30 flex items-center justify-between">
          <span className="text-base font-bold text-white">Grand Total</span>
          <span className="text-2xl font-bold text-accent">{formatCurrency(summary.grandTotal, currency)}</span>
        </div>
      </div>
    </div>
  )
}
