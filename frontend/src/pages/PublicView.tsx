import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'

export default function PublicView() {
  const { token } = useParams<{ token: string }>()
  const [caso, setCaso] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    axios.get(`/api/submissions/public/${token}`).then(r => { setCaso(r.data.caso); setLoading(false) }).catch(e => { setError('No encontrado'); setLoading(false) })
  }, [token])

  if (loading) return <div>Cargando...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <h2 className="text-xl font-semibold">Caso {caso.id}</h2>
      <p className="mt-2">Tipo: {caso.tipo_problema}</p>
      <p className="mt-2">Estado: {caso.estado}</p>
      <div className="mt-4 p-3 bg-gray-50 border">{caso.descripcion}</div>
      <h3 className="mt-4 font-semibold">Adjuntos</h3>
      <ul>
        {caso.attachments.map((a: any) => (
          <li key={a.id}><a href={a.url} target="_blank" rel="noreferrer">{a.filename}</a></li>
        ))}
      </ul>
    </div>
  )
}
