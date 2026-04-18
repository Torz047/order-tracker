'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Profile, UserRole, ROLE_COLORS } from '@/lib/types'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const ROLES: UserRole[] = ['admin','planner1','inventory','logistics','sales']

export default function AdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'sales' as UserRole })
  const [creating, setCreating] = useState(false)
  const [showDemoButtons, setShowDemoButtons] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') router.push('/dashboard')
  }, [profile, loading])

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as Profile[]) || [])
    setLoading(false)
  }

  async function fetchSettings() {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'show_demo_buttons')
      .single()
    if (data) setShowDemoButtons(data.value === 'true')
  }

  useEffect(() => {
    fetchUsers()
    fetchSettings()
  }, [])

  async function saveDemoSetting(val: boolean) {
    setSavingSettings(true)
    const { error } = await supabase
      .from('app_settings')
      .update({ value: val ? 'true' : 'false', updated_by: profile?.id, updated_at: new Date().toISOString() })
      .eq('key', 'show_demo_buttons')
    if (error) toast.error('Failed to save setting')
    else {
      setShowDemoButtons(val)
      toast.success(val ? 'Demo buttons are now visible on login' : 'Demo buttons hidden from login')
    }
    setSavingSettings(false)
  }

  async function createUser() {
    setCreating(true)
    const { error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: { data: { full_name: newUser.full_name, role: newUser.role } }
    })
    if (error) toast.error(error.message)
    else {
      toast.success('User created!')
      setShowCreate(false)
      setNewUser({ email: '', password: '', full_name: '', role: 'sales' })
      setTimeout(fetchUsers, 1000)
    }
    setCreating(false)
  }

  async function updateUser(id: string, updates: Partial<Profile>) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('User updated'); setEditUser(null); fetchUsers() }
  }

  async function toggleActive(user: Profile) {
    await updateUser(user.id, { is_active: !user.is_active })
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} accounts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Create Account
        </button>
      </div>

      {/* ── App Settings Card ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Login Page Settings
        </h2>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Show Demo Login Buttons</p>
            <p className="text-xs text-slate-400 mt-0.5">
              When ON, visitors see one-click buttons for each role on the login page
            </p>
          </div>
          <button
            onClick={() => saveDemoSetting(!showDemoButtons)}
            disabled={savingSettings}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              showDemoButtons ? 'bg-blue-600' : 'bg-slate-300'
            } ${savingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              showDemoButtons ? 'translate-x-6' : 'translate-x-1'
            }`}/>
          </button>
        </div>

        {/* Demo accounts reference */}
        <div className="mt-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs font-semibold text-amber-700 mb-2">📋 Demo Account Credentials</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              { role: 'Admin',     email: 'admin@demo.com',     pw: 'Admin@1234',     color: 'text-purple-600' },
              { role: 'Planner1',  email: 'planner@demo.com',   pw: 'Planner@1234',   color: 'text-blue-600' },
              { role: 'Inventory', email: 'inventory@demo.com', pw: 'Inventory@1234', color: 'text-amber-600' },
              { role: 'Logistics', email: 'logistics@demo.com', pw: 'Logistics@1234', color: 'text-green-600' },
              { role: 'Sales',     email: 'sales@demo.com',     pw: 'Sales@1234',     color: 'text-rose-600' },
            ].map(a => (
              <div key={a.role} className="flex items-center gap-2 text-xs">
                <span className={`font-semibold w-16 ${a.color}`}>{a.role}</span>
                <span className="text-slate-500 font-mono">{a.email}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                {['Name','Email','Role','Status','Created','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className={`hover:bg-slate-50 transition ${!user.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {editUser?.id === user.id ? (
                      <input
                        value={editUser.full_name || ''}
                        onChange={e => setEditUser({ ...editUser, full_name: e.target.value })}
                        className="border border-slate-200 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <>
                        {user.full_name || '—'}
                        {user.id === profile?.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">You</span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    {editUser?.id === user.id ? (
                      <select
                        value={editUser.role}
                        onChange={e => setEditUser({ ...editUser, role: e.target.value as UserRole })}
                        className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {editUser?.id === user.id ? (
                        <>
                          <button
                            onClick={() => updateUser(user.id, { role: editUser.role, full_name: editUser.full_name })}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                          >Save</button>
                          <button
                            onClick={() => setEditUser(null)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 transition"
                          >Cancel</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditUser(user)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                            </svg>
                          </button>
                          {user.id !== profile?.id && (
                            <button
                              onClick={() => toggleActive(user)}
                              className={`p-1.5 rounded transition ${
                                user.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'
                              }`}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                </svg>
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">Create Account</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@company.com' },
                { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(newUser as any)[f.key]}
                    onChange={e => setNewUser(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-slate-200 text-sm rounded-lg hover:bg-slate-50 transition">Cancel</button>
              <button
                onClick={createUser}
                disabled={creating || !newUser.email || !newUser.password}
                className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
              >
                {creating ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
