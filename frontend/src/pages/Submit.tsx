import React, { useState } from 'react'
import axios from 'axios'

export default function Submit() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', category: 'DESPIDO', subject: '', message: '' })
  const [status, setStatus] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await axios.post('/api/submissions', form)
      setPublicToken(res.data.publicToken)
      setStatus('ok')
    } catch (err: any) {
      setStatus('error')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Enviar caso (público)</h2>
      <form onSubmit={submit} className="space-y-3">
        <input placeholder="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2 border" />
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-2 border" />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full p-2 border">
          <option>DESPIDO</option>
          <option>SANCION</option>
          <option>VACACIONES</option>
          <option>IMPAGO</option>
          <option>OTRO</option>
        </select>
        <input placeholder="Asunto" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full p-2 border" />
        <textarea placeholder="Mensaje" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full p-2 border h-32" />
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Enviar</button>
        </div>
      </form>

      {status === 'ok' && publicToken && (
        <div className="mt-4 p-3 bg-green-50 border">Tu token público: <code>{publicToken}</code>
          <div className="mt-2">Compartir enlace: <a href={`/case/${publicToken}`}>Ver caso</a></div>
        </div>
      )}

      {status === 'error' && <div className="mt-2 text-red-600">Error enviando el caso.</div>}
    </div>
  )
}
