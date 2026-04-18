'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { role: 'Admin',     email: 'admin@demo.com',     password: 'Admin@1234',     color: 'bg-purple-500 hover:bg-purple-400', icon: '👑' },
  { role: 'Planner1',  email: 'planner@demo.com',   password: 'Planner@1234',   color: 'bg-blue-500 hover:bg-blue-400',   icon: '📋' },
  { role: 'Inventory', email: 'inventory@demo.com', password: 'Inventory@1234', color: 'bg-amber-500 hover:bg-amber-400', icon: '📦' },
  { role: 'Logistics', email: 'logistics@demo.com', password: 'Logistics@1234', color: 'bg-green-500 hover:bg-green-400', icon: '🚚' },
  { role: 'Sales',     email: 'sales@demo.com',     password: 'Sales@1234',     color: 'bg-rose-500 hover:bg-rose-400',   icon: '💼' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(null)
  const [showDemo, setShowDemo] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchSetting() {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'show_demo_buttons')
        .single()
      if (data) setShowDemo(data.value === 'true')
    }
    fetchSetting()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  const handleDemoLogin = async (account) => {
    setLoadingDemo(account.role)
    const { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })
    if (error) toast.error('Demo login failed: ' + error.message)
    else router.push('/dashboard')
    setLoadingDemo(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Order Tracker</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your account</p>
        </div>

        {showDemo && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 text-center">Quick Demo Login</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.role}
                  onClick={() => handleDemoLogin(account)}
                  disabled={loadingDemo !== null}
                  className={account.color + ' text-white rounded-xl px-4 py-2.5 text-sm font-medium transition flex items-center justify-between disabled:opacity-50'}
                >
                  <span className="flex items-center gap-2">
                    <span>{account.icon}</span>
                    <span>{account.role}</span>
                  </span>
                  <span className="text-xs opacity-70">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10"/>
          <span className="text-slate-500 text-xs">or sign in manually</span>
          <div className="flex-1 h-px bg-white/10"/>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-slate-500 text-xs mt-6">Contact your administrator to create an account</p>
      </div>
    </div>
  )
}
