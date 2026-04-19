'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Order } from '@/lib/types'
import OrderTable from '@/components/OrderTable'
import OrderFormModal from '@/components/OrderFormModal'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error('Failed to load orders')
    else setOrders((data as Order[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o))
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filteredOrders = orders.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return [o.customer, o.alliance_po, o.part_number, o.description, o.general_status, o.cpo]
      .some(v => v?.toLowerCase().includes(q))
  })

  const canAdd = profile?.role === 'admin' || profile?.role === 'planner1'

  const stats = {
    total: orders.length,
    ongoing: orders.filter(o => o.general_status?.toLowerCase() === 'ongoing').length,
    delay: orders.filter(o => o.general_status?.toLowerCase() === 'delayed').length,
    done: orders.filter(o => o.general_status?.toLowerCase() === 'done').length,
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'On Going', value: stats.ongoing, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Delayed', value: stats.delay, color: 'bg-red-50 text-red-700 border-red-100' },
          { label: 'Done', value: stats.done, color: 'bg-slate-50 text-slate-700 border-slate-100' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl px-4 py-3 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by customer, PO#, P/N, status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Add Order
          </button>
        )}
        <span className="text-sm text-slate-400 ml-auto">{filteredOrders.length} orders</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
        </div>
      ) : (
        <OrderTable
          orders={filteredOrders}
          onEdit={setEditOrder}
          onRefresh={fetchOrders}
        />
      )}

      {/* Modals */}
      {showAdd && (
        <OrderFormModal
          mode="create"
          onClose={() => setShowAdd(false)}
          onSaved={fetchOrders}
        />
      )}
      {editOrder && (
        <OrderFormModal
          mode="edit"
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSaved={fetchOrders}
        />
      )}
    </div>
  )
}
