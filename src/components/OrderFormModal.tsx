'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Order, ROLE_EDITABLE_FIELDS, COLUMN_GROUPS, COLUMN_LABELS } from '@/lib/types'
import toast from 'react-hot-toast'

interface Props {
  mode: 'create' | 'edit'
  order?: Order
  onClose: () => void
  onSaved: () => void
}

const FIELD_TYPES: Partial<Record<keyof Order, string>> = {
  po_date_received: 'date', po_rdd: 'date', cpo_rdd: 'date', rdd: 'date',
  etd: 'date', eta: 'date', sap_etd: 'date', po_date: 'date',
  drawing_release: 'date', customer_approval: 'date', eta_not_adjusted: 'date',
  date_of_assy: 'date', date_of_qc_test: 'date',
  qty: 'number', alliance_unit_price: 'number', total_alliance_price: 'number',
  customer_unit_price: 'number', total_customer_price: 'number',
  unit_price: 'number', total_cost: 'number', pin_count: 'number',
  total_pins: 'number', delay_from_crdd: 'number', drawing_lt: 'number',
  delivery_lt: 'number', assembly_lt: 'number', screw_count: 'number',
  module_count: 'number', pin_insertion_sec: 'number', screwing_sec: 'number',
  module_assy_sec: 'number', assy_sec: 'number', parts_fai_sec: 'number',
  assy_fai_sec: 'number', consumption_sec: 'number', total_cost_per_unit: 'number',
  total_cost_calc: 'number', espp_profit: 'number', gross_margin_jpy110: 'number',
  unit_cost_jpy120: 'number', gross_margin_jpy120: 'number',
  unit_cost_jpy150: 'number', gross_margin_jpy150: 'number',
  modules: 'number', us_tariff: 'number',
  drawing_delay: 'boolean', sales_flag: 'boolean', process_flag: 'boolean',
  logistics_flag: 'boolean', design_flag: 'boolean', pin_delay: 'boolean',
  ng_part: 'boolean', machining_capacity: 'boolean', customer_delay: 'boolean',
  holiday: 'boolean', supplier_internal_ng: 'boolean', internal_ng: 'boolean',
  ng_affecting_delivery: 'boolean',
}

// All editable fields (not metadata)
const ALL_FORM_FIELDS: (keyof Order)[] = [
  'bu','site','uai_air','customer','po_date_received','cpo','alliance_po','po_item',
  'prs','qty','order_status','type','part_number','description','dn','rev',
  'consumption_status','part_set_a','crdd','po_rdd','cpo_rdd','rdd',
  'alliance_unit_price','total_alliance_price','customer_unit_price','total_customer_price',
  'assy_po_revision','assembly_po','po_month_year','quotation_no','pin_count',
  'unit_price','total_cost','total_pins','assembly_invoice_no','pin_type',
  'etd_month','etd','eta','ng_ok','assembly_invoice','so_no','sap_etd',
  'general_status','remarks1','tracking_no','invoice_no','temporary_part_no',
  'temporary_drawing_no','drawing_delay','sales_flag','process_flag','logistics_flag',
  'design_flag','pin_delay','ng_part','machining_capacity','customer_delay','holiday',
  'supplier_internal_ng','internal_ng','ng_summary_remarks','remarks','action_item',
  'ng_nature','ng_affecting_delivery','drawing_release','customer_approval',
  'delay_from_crdd','drawing_lt','delivery_lt','assembly_lt','socket_lid',
  'screw_count','module_count','assy_type','pin_orientation','pin_insertion_sec',
  'screwing_sec','module_assy_sec','assy_sec','parts_fai_sec','assy_fai_sec',
  'consumption_sec','total_cost_per_unit','total_cost_calc','espp_profit',
  'gross_margin_jpy110','po_date','ti_customer','fy','assy_drawing','parts_fai',
  'pin_insertion_status','fully_assembly','assembly_fai','coc_shipping_docs',
  'for_packing','assy_remarks','assy_status','fai_status','eta_not_adjusted',
  'internal_ng_ok','customer_po_for_sales','unit_cost_jpy120','gross_margin_jpy120',
  'unit_cost_jpy150','gross_margin_jpy150','modules','us_tariff','date_of_assy',
  'date_of_qc_test','esps',
]

export default function OrderFormModal({ mode, order, onClose, onSaved }: Props) {
  const { profile } = useAuth()
  const [form, setForm] = useState<Partial<Order>>(order || {})
  const [saving, setSaving] = useState(false)
  const [activeGroup, setActiveGroup] = useState(0)
  const supabase = createClient()

  const editableFields = ROLE_EDITABLE_FIELDS[profile?.role || 'sales']
  function canEdit(field: keyof Order) {
    if (editableFields === 'all') return true
    return (editableFields as (keyof Order)[]).includes(field)
  }

  function set(field: keyof Order, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, updated_by: profile?.id }
    if (mode === 'create') payload.created_by = profile?.id

    const { error } = mode === 'create'
      ? await supabase.from('orders').insert(payload)
      : await supabase.from('orders').update(payload).eq('id', order!.id)

    if (error) toast.error(error.message)
    else {
      toast.success(mode === 'create' ? 'Order created' : 'Order updated')
      onSaved()
      onClose()
    }
    setSaving(false)
  }

  // Form groups with their fields
  const formGroups = [
    { label: 'Order Info', fields: ['bu','site','uai_air','customer','po_date_received','cpo','alliance_po','po_item','prs','qty','order_status','type'] as (keyof Order)[] },
    { label: 'Part Details', fields: ['part_number','description','dn','rev','consumption_status','part_set_a','general_status','ng_ok','so_no'] as (keyof Order)[] },
    { label: 'Dates', fields: ['crdd','po_rdd','cpo_rdd','rdd','etd_month','etd','eta','sap_etd','po_date','drawing_release','customer_approval','eta_not_adjusted','date_of_assy','date_of_qc_test'] as (keyof Order)[] },
    { label: 'Pricing', fields: ['alliance_unit_price','total_alliance_price','customer_unit_price','total_customer_price','unit_price','total_cost','total_cost_per_unit','total_cost_calc','espp_profit','gross_margin_jpy110','unit_cost_jpy120','gross_margin_jpy120','unit_cost_jpy150','gross_margin_jpy150','us_tariff'] as (keyof Order)[] },
    { label: 'Assembly', fields: ['assy_po_revision','assembly_po','po_month_year','quotation_no','pin_count','total_pins','assembly_invoice_no','pin_type','assembly_invoice','assy_type','pin_orientation','socket_lid','screw_count','module_count','modules','pin_insertion_sec','screwing_sec','module_assy_sec','assy_sec','parts_fai_sec','assy_fai_sec','consumption_sec','assy_drawing','parts_fai','pin_insertion_status','fully_assembly','assembly_fai','coc_shipping_docs','for_packing','assy_remarks','assy_status','fai_status'] as (keyof Order)[] },
    { label: 'Tracking', fields: ['tracking_no','invoice_no','temporary_part_no','temporary_drawing_no','remarks1','remarks','action_item','ng_nature','ng_summary_remarks','internal_ng_ok','customer_po_for_sales','ti_customer','fy','esps','drawing_lt','delivery_lt','assembly_lt','delay_from_crdd'] as (keyof Order)[] },
    { label: 'Delay Flags', fields: ['drawing_delay','sales_flag','process_flag','logistics_flag','design_flag','pin_delay','ng_part','machining_capacity','customer_delay','holiday','supplier_internal_ng','internal_ng','ng_affecting_delivery'] as (keyof Order)[] },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {mode === 'create' ? 'Add New Order' : `Edit Order — ${order?.alliance_po || order?.id?.slice(0, 8)}`}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 px-4 pt-3 overflow-x-auto border-b border-slate-100 pb-0">
          {formGroups.map((g, i) => (
            <button
              key={g.label}
              onClick={() => setActiveGroup(i)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition ${
                activeGroup === i
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {formGroups[activeGroup].fields.map(field => {
              const fieldType = FIELD_TYPES[field] || 'text'
              const label = COLUMN_LABELS[field] || field.replace(/_/g, ' ').toUpperCase()
              const disabled = !canEdit(field)
              const value = form[field]

              if (fieldType === 'boolean') {
                return (
                  <label key={field} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={e => !disabled && set(field, e.target.checked)}
                      disabled={disabled}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                )
              }

              return (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  <input
                    type={fieldType}
                    value={value !== null && value !== undefined ? String(value) : ''}
                    onChange={e => !disabled && set(field, e.target.value || null)}
                    disabled={disabled}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                      disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    placeholder={disabled ? 'No access' : ''}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <p className="text-xs text-slate-400">
            {editableFields === 'all' ? 'All fields editable' : `Editable: ${(editableFields as string[]).join(', ')}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition flex items-center gap-2"
            >
              {saving && <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {mode === 'create' ? 'Create Order' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
