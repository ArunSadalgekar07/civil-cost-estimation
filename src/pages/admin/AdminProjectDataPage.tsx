import { useState } from 'react'
import { SlidersHorizontal, Settings, Database, BadgeDollarSign, Ruler, Plus, X } from 'lucide-react'
import { useSystemStore } from '@/store/systemStore'
import { toast } from 'sonner'

export default function AdminProjectDataPage() {
  const store = useSystemStore()
  
  // Local state for the "Add New" inputs
  const [inputs, setInputs] = useState<Record<string, string>>({
    projectTypes: '', sizeUnits: '', durationUnits: '', costCategories: '', currencies: ''
  })

  const handleAdd = (key: keyof typeof inputs, storeKey: keyof typeof store) => {
    const val = inputs[key].trim()
    if (!val) return
    
    const currentArray = store[storeKey] as string[]
    if (currentArray.includes(val)) {
      toast.warning('This item already exists in the dictionary.')
      return
    }

    const newArray = [...currentArray, val]
    store.updateDictionary(storeKey, newArray).then(() => {
      toast.success('Taxonomy added successfully!')
      setInputs(prev => ({ ...prev, [key]: '' }))
    }).catch(() => toast.error('Failed communicating with backend.'))
  }

  const handleDelete = (item: string, storeKey: keyof typeof store) => {
    const currentArray = store[storeKey] as string[]
    const newArray = currentArray.filter(v => v !== item)
    store.updateDictionary(storeKey, newArray).then(() => {
      toast.success('Removed successfully.')
    })
  }

  const renderDictionaryCard = (
    title: string, 
    icon: React.ReactNode, 
    storeKey: 'projectTypes' | 'sizeUnits' | 'durationUnits' | 'costCategories' | 'currencies',
    inputKey: string
  ) => {
    const items = store[storeKey] as string[]
    
    return (
      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold mb-2">
          {icon}
          <h3>{title}</h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {items.map(item => (
            <span key={item} className="badge bg-surface border border-surface-border text-surface-muted flex items-center gap-1 group">
              {item}
              <button onClick={() => handleDelete(item, storeKey)} className="text-surface-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-border/50">
          <input 
            type="text" 
            className="input py-1.5 text-sm flex-1" 
            placeholder="Add new item..." 
            value={inputs[inputKey]}
            onChange={e => setInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd(inputKey, storeKey)}
          />
          <button onClick={() => handleAdd(inputKey, storeKey)} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1 shadow-none">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    )
  }

  if (store.loading) {
    return <div className="text-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
  }

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center gap-2 border-b border-surface-border pb-4">
        <SlidersHorizontal size={26} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Project Data Settings (Global)</h1>
      </div>

      <p className="text-surface-muted text-sm max-w-3xl">
        Manage the system dictionaries and taxonomies used across all user projects. 
        Adding a new option here instantly provisions it in every Project Builder dropdown globally.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderDictionaryCard('Project Taxonomy Types', <Database size={18} className="text-accent" />, 'projectTypes', 'projectTypes')}
        {renderDictionaryCard('Size Boundaries', <Ruler size={18} className="text-orange-400" />, 'sizeUnits', 'sizeUnits')}
        {renderDictionaryCard('Duration Timelines', <Ruler size={18} className="text-blue-400" />, 'durationUnits', 'durationUnits')}
        {renderDictionaryCard('Cost Categories', <BadgeDollarSign size={18} className="text-purple-400" />, 'costCategories', 'costCategories')}
        {renderDictionaryCard('Global Currencies', <BadgeDollarSign size={18} className="text-green-400" />, 'currencies', 'currencies')}

        {/* Global Architecture Indicator */}
        <div className="card border-dashed border-2 border-surface-border bg-surface/30 flex flex-col items-center justify-center text-center p-8">
          <Settings size={32} className="text-surface-muted opacity-50 mb-3" />
          <h3 className="text-white font-medium mb-1">State Sync Active</h3>
          <p className="text-sm text-surface-muted">
            The database `app_settings` engine is explicitly online.
          </p>
        </div>
      </div>
    </div>
  )
}
