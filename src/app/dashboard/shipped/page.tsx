'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, COLUMN_LABELS } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const SHIPPED_COLS = [
  'alliance_po','customer','part_number','description','qty',
  'po_date_received','eta','etd','rdd','ng_ok',
  'tracking_no','invoice_no','assembly_invoice_no',
  'alliance_unit_price','total_alliance_price',
  'customer_unit_price','total_customer_price',
  'general_status','remarks1','updated_at'
]

export default function ShippedPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  async function fetchShipped() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('general_status', '%delivered%')
      .order('updated_at', { ascending: false })
    if (error) toast.error('Failed to load shipped orders')
    else setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchShipped() }, [])

  useEffect(() => {
    const channel = supabase
      .channel('shipped_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new
        if (updated.general_status?.toLowerCase().includes('delivered')) {
          setOrders(prev => {
            const exists = prev.find(o => o.id === updated.id)
            if (exists) return prev.map(o => o.id === updated.id ? updated : o)
            toast.success('📦 Order ' + (updated.alliance_po || updated.id.slice(0,8)) + ' moved to Shipped!')
            return [updated, ...prev]
          })
        } else {
          setOrders(prev => prev.filter(o => o.id !== updated.id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = orders.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return [o.customer, o.alliance_po, o.part_number, o.tracking_no, o.invoice_no]
      .some(v => v?.toLowerCase().includes(q))
  })

  function exportCSV() {
    const headers = SHIPPED_COLS.map(c => (COLUMN_LABELS as any)[c] || c).join(',')
    const rows = filtered.map(o =>
      SHIPPED_COLS.map(c => {
        const val = o[c]
        if (val === null || val === undefined) return ''
        const str = String(val)
        return str.includes(',') ? '"' + str + '"' : str
      }).join(',')
    )
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shipped-orders-' + new Date().toISOString().slice(0,10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            📦 Shipped Items
            <span className="text-sm font-normal bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">{orders.length} orders</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Orders automatically moved here when General Status → <span className="font-medium text-green-600">Delivered</span></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Search shipped orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-56"/>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Shipped', value: orders.length, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'This Month', value: orders.filter(o => o.updated_at && new Date(o.updated_at).getMonth() === new Date().getMonth()).length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Total Qty', value: orders.reduce((s, o) => s + (Number(o.qty) || 0), 0).toLocaleString(), color: 'bg-purple-50 text-purple-700 border-purple-100' },
          { label: 'Total Value', value: '$' + orders.reduce((s, o) => s + (Number(o.total_customer_price) || 0), 0).toLocaleString(), color: 'bg-amber-50 text-amber-700 border-amber-100' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl px-4 py-3 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-800 text-white">
                <th className="px-4 py-3 text-left text-xs font-semibold">#</th>
                {SHIPPED_COLS.map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{(COLUMN_LABELS[col] || col).toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={SHIPPED_COLS.length + 1} className="text-center py-12 text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={SHIPPED_COLS.length + 1} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <span className="text-4xl">📦</span>
                      <p className="font-medium">No shipped orders yet</p>
                      <p className="text-xs">Orders appear here automatically when General Status is set to <strong>Delivered</strong></p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((order, idx) => (
                <tr key={order.id} className={'hover:bg-green-50/30 transition ' + (idx % 2 === 1 ? 'bg-slate-50/40' : '')}>
                  <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{idx + 1}</td>
                  {SHIPPED_COLS.map(col => {
                    const val = order[col]
                    const isDate = col === 'updated_at' && val
                    const isStatus = col === 'general_status'
                    const isCurrency = ['alliance_unit_price','total_alliance_price','customer_unit_price','total_customer_price'].includes(col)
                    return (
                      <td key={col} className="px-4 py-2.5 whitespace-nowrap max-w-[180px]">
                        {isDate ? (
                          <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(val), { addSuffix: true })}</span>
                        ) : isStatus ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{String(val || '—')}</span>
                        ) : isCurrency && val ? (
                          <span className="text-slate-700 font-mono text-xs">${Number(val).toLocaleString()}</span>
                        ) : (
                          <span className={'text-xs truncate block ' + (!val ? 'text-slate-300' : 'text-slate-700')}>{val !== null && val !== undefined ? String(val) : '—'}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400">🔄 Updates in real-time. Orders appear automatically when General Status is changed to "Delivered".</p>
    </div>
  )
}
