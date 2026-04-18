'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Order, ROLE_EDITABLE_FIELDS, COLUMN_LABELS, COLUMN_GROUPS } from '@/lib/types'
import toast from 'react-hot-toast'

interface Props {
  orders: Order[]
  onEdit: (o: Order) => void
  onRefresh: () => void
}

const STATUS_COLORS: Record<string, string> = {
  'on going':  'bg-green-100 text-green-700',
  'done':      'bg-slate-100 text-slate-600',
  'delay':     'bg-red-100 text-red-700',
  'rep':       'bg-blue-100 text-blue-700',
  'ok':        'bg-green-100 text-green-700',
  'ng':        'bg-red-100 text-red-700',
}
function statusClass(val?: string) {
  if (!val) return ''
  return STATUS_COLORS[val.toLowerCase()] || 'bg-slate-50 text-slate-600'
}

// All columns to show in table (a manageable subset of the full schema)
const TABLE_COLUMNS: (keyof Order)[] = [
  'bu','site','customer','alliance_po','po_item','qty','order_status','type',
  'part_number','description','consumption_status','crdd','rdd','eta','etd',
  'ng_ok','general_status','tracking_no','invoice_no','assembly_invoice_no',
  'remarks1','po_date_received','alliance_unit_price','total_alliance_price',
  'customer_unit_price','total_customer_price',
]

export default function OrderTable({ orders, onEdit, onRefresh }: Props) {
  const { profile } = useAuth()
  const [visibleCols, setVisibleCols] = useState<Set<keyof Order>>(new Set(TABLE_COLUMNS.slice(0, 16)))
  const [editCell, setEditCell] = useState<{ orderId: string; field: keyof Order } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [showColPicker, setShowColPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const editableFields = ROLE_EDITABLE_FIELDS[profile?.role || 'sales']

  function canEdit(field: keyof Order) {
    if (editableFields === 'all') return true
    return (editableFields as (keyof Order)[]).includes(field)
  }

  function startEdit(order: Order, field: keyof Order) {
    if (!canEdit(field)) return
    setEditCell({ orderId: order.id, field })
    setEditValue(String(order[field] ?? ''))
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function saveEdit() {
    if (!editCell) return
    setSaving(true)
    const { orderId, field } = editCell
    const oldOrder = orders.find(o => o.id === orderId)
    const oldValue = String(oldOrder?.[field] ?? '')

    const { error } = await supabase
      .from('orders')
      .update({ [field]: editValue || null, updated_by: profile?.id })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to save')
    } else {
      // Audit log
      await supabase.from('audit_log').insert({
        order_id: orderId,
        user_id: profile?.id,
        action: 'update',
        field_name: field,
        old_value: oldValue,
        new_value: editValue,
      })
      toast.success('Saved')
    }
    setEditCell(null)
    setSaving(false)
  }

  function cancelEdit() { setEditCell(null) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  async function deleteOrder(id: string) {
    if (!confirm('Delete this order?')) return
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) toast.error('Failed to delete')
    else { toast.success('Deleted'); onRefresh() }
  }

  const cols = TABLE_COLUMNS.filter(c => visibleCols.has(c))

  return (
    <div className="space-y-2">
      {/* Column picker */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowColPicker(!showColPicker)}
          className="flex items-center gap-1.5 text-sm text-slate-600 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Columns
        </button>
      </div>

      {showColPicker && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-slate-800 text-sm">Toggle Columns</span>
            <button onClick={() => setShowColPicker(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 max-h-64 overflow-y-auto">
            {TABLE_COLUMNS.map(col => (
              <label key={col} className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={visibleCols.has(col)}
                  onChange={e => {
                    const next = new Set(visibleCols)
                    if (e.target.checked) next.add(col)
                    else next.delete(col)
                    setVisibleCols(next)
                  }}
                  className="accent-blue-600"
                />
                <span className="text-xs text-slate-600 truncate">{COLUMN_LABELS[col] || col}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                {cols.map(col => (
                  <th key={col} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap tracking-wide">
                    {COLUMN_LABELS[col] || col.toUpperCase()}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left text-xs font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 1} className="text-center py-12 text-slate-400">
                    No orders found
                  </td>
                </tr>
              ) : orders.map((order, idx) => (
                <tr
                  key={order.id}
                  className={`hover:bg-blue-50/30 transition ${idx % 2 === 1 ? 'bg-slate-50/50' : ''} ${
                    order.general_status?.toLowerCase().includes('delay') ? 'bg-red-50/40' : ''
                  }`}
                >
                  {cols.map(col => {
                    const isEditing = editCell?.orderId === order.id && editCell?.field === col
                    const editable = canEdit(col)
                    const val = order[col]

                    const isStatus = ['general_status','order_status','ng_ok'].includes(col)

                    return (
                      <td
                        key={col}
                        onClick={() => editable && !isEditing && startEdit(order, col)}
                        className={`px-3 py-2 whitespace-nowrap max-w-[200px] ${
                          editable ? 'cursor-pointer hover:bg-blue-100/40' : ''
                        } ${isEditing ? 'p-0' : ''}`}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyDown}
                            disabled={saving}
                            className="w-full px-3 py-2 border-2 border-blue-500 rounded text-sm focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            {isStatus && val ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(String(val))}`}>
                                {String(val)}
                              </span>
                            ) : (
                              <span className={`text-slate-700 truncate ${!val ? 'text-slate-300' : ''}`}>
                                {val !== null && val !== undefined ? String(val) : '—'}
                              </span>
                            )}
                            {editable && val !== null && val !== undefined && (
                              <svg className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                              </svg>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {(profile?.role === 'admin' || profile?.role === 'planner1') && (
                        <button
                          onClick={() => onEdit(order)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit full order"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                          </svg>
                        </button>
                      )}
                      {profile?.role === 'admin' && (
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {canEdit('general_status') ? '✏️ Click any cell to edit inline. Press Enter to save, Esc to cancel.' : '👁️ View only mode for your role.'}
      </p>
    </div>
  )
}
