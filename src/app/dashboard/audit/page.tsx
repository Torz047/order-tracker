'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface AuditEntry {
  id: string
  order_id: string
  user_id: string
  action: string
  field_name?: string
  old_value?: string
  new_value?: string
  created_at: string
  profiles?: { full_name: string; email: string; role: string }
  orders?: { alliance_po: string; part_number: string }
}

export default function AuditPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') router.push('/dashboard')
  }, [profile, loading])

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('audit_log')
        .select('*, profiles(full_name, email, role), orders(alliance_po, part_number)')
        .order('created_at', { ascending: false })
        .limit(500)
      setEntries((data as AuditEntry[]) || [])
      setFetching(false)
    }
    fetch()
  }, [])

  const filtered = entries.filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    return [
      e.profiles?.email, e.profiles?.full_name,
      e.field_name, e.old_value, e.new_value,
      e.orders?.alliance_po, e.orders?.part_number,
    ].some(v => v?.toLowerCase().includes(q))
  })

  const actionColor = (a: string) => {
    if (a === 'update') return 'bg-blue-100 text-blue-700'
    if (a === 'insert') return 'bg-green-100 text-green-700'
    if (a === 'delete') return 'bg-red-100 text-red-700'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">All changes made to orders</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                {['Time','User','Role','Order','Action','Field','Old Value','New Value'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fetching ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">No audit entries found</td></tr>
              ) : filtered.map((e, i) => (
                <tr key={e.id} className={`hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 text-xs whitespace-nowrap">
                    {e.profiles?.full_name || e.profiles?.email || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {e.profiles?.role && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{e.profiles.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs whitespace-nowrap font-mono">
                    {e.orders?.alliance_po || e.order_id?.slice(0, 8) || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(e.action)}`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs font-mono whitespace-nowrap">
                    {e.field_name || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-red-400 text-xs max-w-[140px] truncate">
                    {e.old_value || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-green-600 text-xs max-w-[140px] truncate font-medium">
                    {e.new_value || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
