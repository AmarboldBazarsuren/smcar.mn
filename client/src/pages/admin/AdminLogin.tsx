import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../../lib/api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { accessToken, refreshToken } = await adminLogin(username, password)
      localStorage.setItem('adminToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      navigate('/smcaradmin/dashboard')
    } catch {
      setError('Нэвтрэх нэр эсвэл нууц үг буруу байна')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a1a' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
              <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
              <path d="M5 17H3v-4l2-5h9l4 5h1a2 2 0 0 1 2 2v2h-2" />
              <path d="M9 17h6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#fff' }}>SMCar Admin</h1>
          <p className="text-lg mt-1" style={{ color: '#64748b' }}>Админ панел руу нэвтрэх</p>
        </div>

        {/* Login form */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#94a3b8' }}>Нэвтрэх нэр</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                placeholder="Username"
              />
            </div>
            <div>
              <label className="block text-base font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#94a3b8' }}>Нууц үг</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                placeholder="Password"
              />
            </div>
            {error && (
              <div className="text-lg px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3.5 rounded-xl text-lg font-semibold transition-all disabled:opacity-50"
              style={{ color: '#fff' }}
            >
              {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
