import { create } from 'zustand'
import { db } from '@/lib/supabase'
import type { Notification } from '@/types'

interface NotificationState {
  notifications: Notification[]
  loading: boolean
  unreadCount: number
  
  fetchNotifications: (userId: string) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: (userId: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  fetchNotifications: async (userId: string) => {
    set({ loading: true })
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      set({ 
        notifications: data as Notification[],
        unreadCount: (data as Notification[]).filter(n => !n.is_read).length,
        loading: false 
      })
    } else {
      set({ loading: false })
    }
  },

  markAsRead: async (id: string) => {
    const { data, error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      const current = get().notifications
      const updated = current.map(n => n.id === id ? data as Notification : n)
      set({ 
        notifications: updated,
        unreadCount: updated.filter(n => !n.is_read).length
      })
    }
  },

  markAllAsRead: async (userId: string) => {
    const { error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (!error) {
      const updated = get().notifications.map(n => ({ ...n, is_read: true }))
      set({ 
        notifications: updated,
        unreadCount: 0
      })
    }
  }
}))
