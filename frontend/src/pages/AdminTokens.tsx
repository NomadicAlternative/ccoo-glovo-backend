import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function AdminTokens() {
  const [tokens, setTokens] = useState<any[]>([])

  useEffect(() => {
    axios.get('/api/admin/refresh-tokens?status=all').then(r => setTokens(r.data.tokens)).catch(() => setTokens([]))
  }, [])

  const revoke = async (id: number) => {
    await axios.post(`/api/admin/refresh-tokens/${id}/revoke`)
    // refresh
    const r = await axios.get('/api/admin/refresh-tokens?status=all')
    setTokens(r.data.tokens)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Refresh tokens</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr><th>ID</th><th>tokenId</th><th>userId</th><th>revoked</th><th>expiresAt</th><th>actions</th></tr>
        </thead>
        <tbody>
          {tokens.map(t => (
            <tr key={t.id} className="border-t">
              <td>{t.id}</td>
              <td>{t.tokenId}</td>
              <td>{t.userId}</td>
              <td>{t.revoked ? 'yes' : 'no'}</td>
              <td>{t.expiresAt}</td>
              <td>{!t.revoked && <button onClick={() => revoke(t.id)} className="px-2 py-1 bg-red-600 text-white rounded">Revoke</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
