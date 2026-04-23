import { create } from 'zustand'
import { db } from '@/lib/supabase'

interface SystemState {
  projectTypes: string[]
  sizeUnits: string[]
  durationUnits: string[]
  costCategories: string[]
  currencies: string[]
  loading: boolean
  
  fetchDictionaries: () => Promise<void>
  updateDictionary: (key: string, values: string[]) => Promise<void>
}

const DEFAULT_DEFS = {
  projectTypes: ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Renovation', 'Landscaping', 'Institutional', 'Mixed-Use'],
  sizeUnits: ['Square Meters', 'Square Feet', 'Hectares', 'Acres'],
  durationUnits: ['Days', 'Weeks', 'Months', 'Years'],
  costCategories: ['materials', 'labor', 'equipment', 'additional'],
  currencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'YER', 'KWD', 'QAR', 'INR']
}

export const useSystemStore = create<SystemState>((set, get) => ({
  ...DEFAULT_DEFS,
  loading: true,

  fetchDictionaries: async () => {
    try {
      const { data, error } = await db.from('app_settings').select('key, value').like('key', 'dict_%')
      if (error) throw error
      
      const loaded: Partial<SystemState> = {}
      data?.forEach(row => {
        try {
          const parsed = JSON.parse(row.value || '[]')
          if (row.key === 'dict_project_types') loaded.projectTypes = parsed
          if (row.key === 'dict_size_units') loaded.sizeUnits = parsed
          if (row.key === 'dict_duration_units') loaded.durationUnits = parsed
          if (row.key === 'dict_cost_categories') loaded.costCategories = parsed
          if (row.key === 'dict_currencies') loaded.currencies = parsed
        } catch(e) {
          console.warn('Failed parsing dictionary array for: ', row.key)
        }
      })
      
      set({ ...loaded, loading: false })
    } catch(err) {
      console.error('Failed fetching dicts, falling back to defaults.', err)
      set({ loading: false })
    }
  },

  updateDictionary: async (key: string, values: string[]) => {
    const rawKey = `dict_${key.replace(/([A-Z])/g, "_$1").toLowerCase()}`
    
    // Optimistic frontend commit
    set({ [key]: values })

    // Upsert backend permanently
    await db.from('app_settings').upsert({
      key: rawKey,
      value: JSON.stringify(values)
    }, { onConflict: 'key' })
  }
}))
