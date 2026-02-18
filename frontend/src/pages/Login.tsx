import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { setAccessToken } = useAuth()
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post('/api/auth/login', { email, password })
      setAccessToken(res.data.accessToken)
      navigate('/admin/tokens')
    } catch (err) {
      setError('Credenciales inválidas')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border" />
        <input value={password} type="password" onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border" />
        <div><button className="px-4 py-2 bg-green-600 text-white rounded">Entrar</button></div>
      </form>
      {error && <div className="mt-2 text-red-600">{error}</div>}
    </div>
  )
}
