import { useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Bell, CheckSquare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { cn } from '@/lib/utils'

export default function NotificationsDropdown() {
  const { user } = useAuthStore()
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id)
    }
  }, [user])

  const handleMarkAllAsRead = () => {
    if (user && unreadCount > 0) {
      markAllAsRead(user.id)
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="relative btn btn-ghost p-2 focus:outline-none hidden sm:flex">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger border-2 border-surface-card rounded-full animate-pulse" />
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content 
          className="bg-surface-card border border-surface-border rounded-xl shadow-2xl z-50 w-80 animate-in mr-4"
          sideOffset={8}
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-surface-border">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-accent hover:text-white flex items-center gap-1 transition-colors"
              >
                <CheckSquare size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-surface-muted">
                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">You have no notifications</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                    className={cn(
                      "p-3 border-b border-surface-border/50 last:border-0 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 items-start",
                      !notif.is_read ? 'bg-accent/5' : ''
                    )}
                  >
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    )}
                    <div className={cn("flex-1", notif.is_read && 'pl-5')}>
                      <p className={cn("text-sm transition-colors", notif.is_read ? 'text-surface-muted' : 'text-white font-medium')}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-surface-muted mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-surface-muted/60 mt-1 uppercase tracking-wider">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
