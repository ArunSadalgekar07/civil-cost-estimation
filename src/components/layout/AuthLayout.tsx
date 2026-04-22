import { Home } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Home size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-tight">Cost Estimator</p>
            <p className="text-blue-200 text-xs">Construction Management</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Estimate Smarter,<br />Build Better.
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            Professional construction cost estimation with materials, labor, equipment breakdown, 
            financial summaries, and multilingual support.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Projects', value: '500+' },
              { label: 'Users', value: '1.2K' },
              { label: 'Languages', value: '2' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-blue-200 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-blue-300 text-xs">
          © 2026 Construction Cost Estimator. All rights reserved.
        </p>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
              <Home size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white">Cost Estimator</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
