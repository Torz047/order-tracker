'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { ROLE_COLORS } from '@/lib/types'
import NotificationBell from '@/components/NotificationBell'

const navItems = [
  { href: '/dashboard', label: 'Orders', icon: '📋', roles: ['admin','planner1','inventory','logistics','sales'] },
  { href: '/dashboard/shipped', label: 'Shipped Items', icon: '📦', roles: ['admin','planner1','inventory','logistics','sales'] },
  { href: '/dashboard/admin', label: 'User Management', icon: '👥', roles: ['admin'] },
  { href: '/dashboard/audit', label: 'Audit Log', icon: '📜', roles: ['admin'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
      </div>
    )
  }

  if (!user || !profile) return null

  const visibleNav = navItems.filter(n => n.roles.includes(profile.role))

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-slate-800 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="hidden sm:block">Order Tracker</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
            {visibleNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[profile.role]}`}>
                {profile.role}
              </span>
              <span className="text-sm text-slate-700 hidden sm:block">{profile.full_name || profile.email}</span>
            </div>
            <button
              onClick={signOut}
              className="text-sm text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4">
        {children}
      </main>
    </div>
  )
}
