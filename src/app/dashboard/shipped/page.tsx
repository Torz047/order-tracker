'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const SHIPPED_COLS = ['alliance_po','customer','part_number','description','qty','po_date_received','eta','etd','rdd','ng_ok','tracking_no','invoice_no','assembly_invoice_no','alliance_unit_price','total_alliance_price','customer_unit_price','total_customer_price','general_status','remarks1','updated_at']

const LABELS: Record<string,string> = {
  alliance_po:'ALLIANCE PO#', customer:'CUSTOMER', part_number:'P/N', description:'DESCRIPTION',
  qty:'QTY', po_date_received:'PO DATE', eta:'ETA', etd:'ETD', rdd:'RDD', ng_ok:'NG/OK',
  tracking_no:'TRACKING#', invoice_no:'INVOICE#', assembly_invoice_no:'ASSEMBLY INVOICE#',
  alliance_unit_price:'ALLIANCE UNIT PRICE', total_alliance_price:'TOTAL ALLIANCE PRICE',
  customer_unit_price:'CUSTOMER UNIT PRICE', total_customer_price:'TOTAL CUSTOMER PRICE',
  general_status:'GENERAL STATUS', remarks1:'REMARKS', updated_at:'LAST UPDATED'
}

const CURRENCY_COLS = ['alliance_unit_price','total_alliance_price','customer_unit_price','total_customer_price']

export default function ShippedPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  async function fetchShipped() {
    const { data, error } = await supabase
      .from('orders').select('*').ilike('general_status','%delivered%').order('updated_at',{ascending:false})
    if (error) toast.error('Failed to load')
    else setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchShipped() }, [])

  useEffect(() => {
    const ch = supabase.channel('shipped_rt')
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders'},(payload) => {
        const u = payload.new as any
        if (u.general_status?.toLowerCase().includes('delivered')) {
          setOrders(prev => {
            const exists = prev.find(o => o.id === u.id)
            if (exists) return prev.map(o => o.id === u.id ? u : o)
            toast.success('📦 ' + (u.alliance_po || u.id.slice(0,8)) + ' moved to Shipped!')
            return [u, ...prev]
          })
        } else {
          setOrders(prev => prev.filter(o => o.id !== u.id))
        }
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const filtered = search
    ? orders.filter(o => [o.customer,o.alliance_po,o.part_number,o.tracking_no,o.invoice_no].some(v => v?.toLowerCase().includes(search.toLowerCase())))
    : orders

  function exportCSV() {
    const csv = [SHIPPED_COLS.map(c => LABELS[c]||c).join(','),
      ...filtered.map(o => SHIPPED_COLS.map(c => { const v=String(o[c]??''); return v.includes(',') ? '"'+v+'"' : v }).join(','))
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    a.download = 'shipped-'+new Date().toISOString().slice(0,10)+'.csv'
    a.click()
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
          <p className="text-sm text-slate-500 mt-0.5">Auto-updated when General Status → <span className="font-medium text-green-600">Delivered</span></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-48"/>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Total Shipped', value:orders.length, color:'bg-green-50 text-green-700 border-green-100'},
          {label:'This Month', value:orders.filter(o=>o.updated_at&&new Date(o.updated_at).getMonth()===new Date().getMonth()).length, color:'bg-blue-50 text-blue-700 border-blue-100'},
          {label:'Total Qty', value:orders.reduce((s,o)=>s+(Number(o.qty)||0),0).toLocaleString(), color:'bg-purple-50 text-purple-700 border-purple-100'},
          {label:'Total Value', value:'$'+orders.reduce((s,o)=>s+(Number(o.total_customer_price)||0),0).toLocaleString(), color:'bg-amber-50 text-amber-700 border-amber-100'},
        ].map(s=>(
          <div key={s.label} className={`border rounded-xl px-4 py-3 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-800 text-white">
                <th className="px-4 py-3 text-left text-xs font-semibold">#</th>
                {SHIPPED_COLS.map(c=><th key={c} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{LABELS[c]||c}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={SHIPPED_COLS.length+1} className="text-center py-12 text-slate-400">Loading...</td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan={SHIPPED_COLS.length+1} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <span className="text-4xl">📦</span>
                    <p className="font-medium">No shipped orders yet</p>
                    <p className="text-xs">Set any order's General Status to <strong>Delivered</strong> to see it here</p>
                  </div>
                </td></tr>
              ) : filtered.map((o,i)=>(
                <tr key={o.id} className={'hover:bg-green-50/30 transition '+(i%2===1?'bg-slate-50/40':'')}>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{i+1}</td>
                  {SHIPPED_COLS.map(c=>{
                    const v = o[c]
                    return (
                      <td key={c} className="px-4 py-2.5 whitespace-nowrap max-w-[180px]">
                        {c==='updated_at'&&v ? <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(v),{addSuffix:true})}</span>
                        : c==='general_status' ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{String(v||'—')}</span>
                        : CURRENCY_COLS.includes(c)&&v ? <span className="text-xs font-mono">${Number(v).toLocaleString()}</span>
                        : <span className={'text-xs '+(v?'text-slate-700':'text-slate-300')}>{v!=null?String(v):'—'}</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400">🔄 Real-time updates. Orders move here automatically when status is set to Delivered.</p>
    </div>
  )
}