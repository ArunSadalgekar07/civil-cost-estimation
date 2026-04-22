import { CreditCard } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard size={20} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
      </div>
      <div className="card text-center py-16 text-surface-muted">
        <CreditCard size={48} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Subscription management coming soon.</p>
      </div>
    </div>
  )
}
