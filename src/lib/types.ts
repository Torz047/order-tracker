export type UserRole = 'admin' | 'planner1' | 'inventory' | 'logistics' | 'sales'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  bu?: string
  site?: string
  uai_air?: string
  customer?: string
  po_date_received?: string
  cpo?: string
  alliance_po?: string
  po_item?: string
  prs?: string
  qty?: number
  order_status?: string
  type?: string
  part_number?: string
  description?: string
  dn?: string
  rev?: string
  consumption_status?: string
  part_set_a?: string
  crdd?: string
  po_rdd?: string
  cpo_rdd?: string
  rdd?: string
  alliance_unit_price?: number
  total_alliance_price?: number
  customer_unit_price?: number
  total_customer_price?: number
  assy_po_revision?: string
  assembly_po?: string
  po_month_year?: string
  quotation_no?: string
  pin_count?: number
  unit_price?: number
  total_cost?: number
  total_pins?: number
  assembly_invoice_no?: string
  pin_type?: string
  etd_month?: string
  etd?: string
  eta?: string
  ng_ok?: string
  assembly_invoice?: string
  so_no?: string
  sap_etd?: string
  general_status?: string
  remarks1?: string
  tracking_no?: string
  invoice_no?: string
  temporary_part_no?: string
  temporary_drawing_no?: string
  drawing_delay?: boolean
  sales_flag?: boolean
  process_flag?: boolean
  logistics_flag?: boolean
  design_flag?: boolean
  pin_delay?: boolean
  ng_part?: boolean
  machining_capacity?: boolean
  customer_delay?: boolean
  holiday?: boolean
  supplier_internal_ng?: boolean
  internal_ng?: boolean
  ng_summary_remarks?: string
  remarks?: string
  action_item?: string
  ng_nature?: string
  ng_affecting_delivery?: boolean
  drawing_release?: string
  customer_approval?: string
  delay_from_crdd?: number
  drawing_lt?: number
  delivery_lt?: number
  assembly_lt?: number
  socket_lid?: string
  screw_count?: number
  module_count?: number
  assy_type?: string
  pin_orientation?: string
  pin_insertion_sec?: number
  screwing_sec?: number
  module_assy_sec?: number
  assy_sec?: number
  parts_fai_sec?: number
  assy_fai_sec?: number
  consumption_sec?: number
  total_cost_per_unit?: number
  total_cost_calc?: number
  espp_profit?: number
  gross_margin_jpy110?: number
  po_date?: string
  ti_customer?: string
  fy?: string
  assy_drawing?: string
  parts_fai?: string
  pin_insertion_status?: string
  fully_assembly?: string
  assembly_fai?: string
  coc_shipping_docs?: string
  for_packing?: string
  assy_remarks?: string
  assy_status?: string
  fai_status?: string
  eta_not_adjusted?: string
  internal_ng_ok?: string
  customer_po_for_sales?: string
  unit_cost_jpy120?: number
  gross_margin_jpy120?: number
  unit_cost_jpy150?: number
  gross_margin_jpy150?: number
  modules?: number
  us_tariff?: number
  date_of_assy?: string
  date_of_qc_test?: string
  esps?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface Notification {
  id: string
  user_id: string
  order_id: string
  message: string
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  order_id: string
  user_id: string
  action: string
  field_name?: string
  old_value?: string
  new_value?: string
  created_at: string
}

export const ROLE_EDITABLE_FIELDS: Record<UserRole, (keyof Order)[] | 'all'> = {
  admin: 'all',
  planner1: 'all',
  inventory: ['consumption_status'],
  logistics: ['tracking_no', 'invoice_no', 'assembly_invoice_no'],
  sales: [],
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  planner1: 'bg-blue-100 text-blue-800',
  inventory: 'bg-amber-100 text-amber-800',
  logistics: 'bg-green-100 text-green-800',
  sales: 'bg-rose-100 text-rose-800',
}

export const COLUMN_GROUPS = [
  { label: 'Order Info', columns: ['bu','site','uai_air','customer','po_date_received','cpo','alliance_po','po_item','prs','qty','order_status','type'] },
  { label: 'Part Details', columns: ['part_number','description','dn','rev','consumption_status','part_set_a'] },
  { label: 'Dates', columns: ['crdd','po_rdd','cpo_rdd','rdd','etd_month','etd','eta','sap_etd','po_date'] },
  { label: 'Pricing', columns: ['alliance_unit_price','total_alliance_price','customer_unit_price','total_customer_price','unit_price','total_cost'] },
  { label: 'Assembly', columns: ['assy_po_revision','assembly_po','po_month_year','quotation_no','pin_count','total_pins','assembly_invoice_no','pin_type','assembly_invoice'] },
  { label: 'Status & Tracking', columns: ['general_status','ng_ok','so_no','tracking_no','invoice_no','remarks1'] },
  { label: 'Delay Flags', columns: ['drawing_delay','sales_flag','process_flag','logistics_flag','design_flag','pin_delay','ng_part','machining_capacity','customer_delay','holiday','supplier_internal_ng','internal_ng'] },
]

export const COLUMN_LABELS: Partial<Record<keyof Order, string>> = {
  bu: 'BU', site: 'SITE', uai_air: 'UAI/AIR', customer: 'CUSTOMER',
  po_date_received: 'PO DATE RECEIVED', cpo: 'CPO', alliance_po: 'ALLIANCE PO#',
  po_item: 'PO ITEM#', prs: 'PRS', qty: 'QTY', order_status: 'ORDER STATUS',
  type: 'TYPE', part_number: 'P/N', description: 'DESCRIPTION', dn: 'D/N',
  rev: 'REV', consumption_status: 'CONSUMPTION STATUS', part_set_a: 'PARTS ETA',
  crdd: 'CRDD', po_rdd: 'PO RDD', cpo_rdd: 'CPO RDD', rdd: 'RDD',
  alliance_unit_price: 'ALLIANCE UNIT PRICE', total_alliance_price: 'TOTAL ALLIANCE PRICE',
  customer_unit_price: 'CUSTOMER UNIT PRICE', total_customer_price: 'TOTAL CUSTOMER PRICE',
  assembly_po: 'ASSEMBLY PO#', po_month_year: 'PO MONTH-YEAR', quotation_no: 'QUOTATION#',
  pin_count: 'PIN COUNT', unit_price: 'UNIT PRICE', total_cost: 'TOTAL COST',
  total_pins: 'TOTAL PINS', assembly_invoice_no: 'ASSEMBLY INVOICE#', pin_type: 'PIN TYPE',
  etd_month: 'ETD MONTH', etd: 'ETD', eta: 'ETA', ng_ok: 'NG/OK',
  assembly_invoice: 'ASSEMBLY INVOICE', so_no: 'SO#', sap_etd: 'SAP ETD',
  general_status: 'GENERAL STATUS', remarks1: 'REMARKS1', tracking_no: 'TRACKING#',
  invoice_no: 'INVOICE#', drawing_delay: 'DRAWING DELAY', sales_flag: 'SALES',
  process_flag: 'PROCESS', logistics_flag: 'LOGISTICS', design_flag: 'DESIGN',
  assy_po_revision: 'ASSY PO REVISION', total_cost_per_unit: 'TOTAL COST/UNIT',
  gross_margin_jpy110: 'GROSS MARGIN JPY110', po_date: 'PO DATE',
  ti_customer: 'TI CUSTOMER', fy: 'FY', assy_drawing: 'ASSY DRAWING',
  parts_fai: 'PARTS FAI', pin_insertion_status: 'PIN INSERTION', fully_assembly: 'FULLY ASSEMBLY',
  assembly_fai: 'ASSEMBLY FAI', coc_shipping_docs: 'COC/SHIPPING DOCS',
  for_packing: 'FOR PACKING', assy_remarks: 'ASSY REMARKS', assy_status: 'ASSY STATUS',
  fai_status: 'FAI STATUS', eta_not_adjusted: 'ETA (NOT ADJUSTED)',
  internal_ng_ok: 'INTERNAL NG/OK', customer_po_for_sales: 'CUSTOMER PO FOR SALES',
  unit_cost_jpy120: 'UNIT COST JPY120', gross_margin_jpy120: 'GM JPY120',
  unit_cost_jpy150: 'UNIT COST JPY150', gross_margin_jpy150: 'GM JPY150',
  modules: 'MODULES', us_tariff: 'US TARIFF', date_of_assy: 'DATE OF ASSY',
  date_of_qc_test: 'DATE OF QC TEST', esps: 'ESPS',
  socket_lid: 'SOCKET/LID', screw_count: 'SCREW COUNT', module_count: 'MODULE COUNT',
  assy_type: 'ASSY TYPE', pin_orientation: 'PIN ORIENTATION',
  pin_insertion_sec: 'PIN INSERTION (SEC)', screwing_sec: 'SCREWING (SEC)',
  module_assy_sec: 'MODULE ASSY (SEC)', assy_sec: 'ASSY (SEC)',
  parts_fai_sec: 'PARTS FAI (SEC)', assy_fai_sec: 'ASSY FAI (SEC)',
  consumption_sec: 'CONSUMPTION (SEC)', temporary_part_no: 'TEMP PART#',
  temporary_drawing_no: 'TEMP DRAWING#', ng_summary_remarks: 'NG SUMMARY REMARKS',
  action_item: 'ACTION ITEM', ng_nature: 'NG NATURE',
  ng_affecting_delivery: 'NG AFFECTING DELIVERY', drawing_release: 'DRAWING RELEASE',
  customer_approval: 'CUSTOMER APPROVAL', delay_from_crdd: 'DELAY FROM CRDD',
  drawing_lt: 'DRAWING LT', delivery_lt: 'DELIVERY LT', assembly_lt: 'ASSEMBLY LT',
  pin_delay: 'PIN DELAY', ng_part: 'NG PART', machining_capacity: 'MACHINING CAPACITY',
  customer_delay: 'CUSTOMER DELAY', holiday: 'HOLIDAY',
  supplier_internal_ng: 'SUPPLIER/INTERNAL NG', internal_ng: 'INTERNAL NG',
  total_cost_calc: 'TOTAL COST (CALC)', espp_profit: 'ESPP PROFIT',
}
