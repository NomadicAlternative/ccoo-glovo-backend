import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkerAuth } from '../context/WorkerAuthContext'

interface Attachment {
  id: number
  filename: string
}

interface Case {
  id: number
  tipo_problema: string | null
  descripcion: string
  estado: string | null
  fecha_creacion: string | null
  attachments: Attachment[]
}

const estadoConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳' },
  en_revision: { label: 'En Revisión', color: 'text-blue-700', bg: 'bg-blue-100', icon: '🔍' },
  en_proceso: { label: 'En Proceso', color: 'text-purple-700', bg: 'bg-purple-100', icon: '⚙️' },
  resuelto: { label: 'Resuelto', color: 'text-green-700', bg: 'bg-green-100', icon: '✅' },
  cerrado: { label: 'Cerrado', color: 'text-gray-700', bg: 'bg-gray-100', icon: '📁' }
}

const tipoConfig: Record<string, { label: string; icon: string }> = {
  despido: { label: 'Despido', icon: '🚫' },
  sancion: { label: 'Sanción', icon: '⚠️' },
  vacaciones: { label: 'Vacaciones', icon: '🏖️' },
  impago: { label: 'Impago', icon: '💰' },
  otro: { label: 'Otro', icon: '📋' }
}

export default function WorkerCases() {
  const { workerToken, workerProfile, isLoading: authLoading, setWorkerToken, sessionExpired } = useWorkerAuth()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !workerToken) {
      navigate('/trabajador/login', { state: { sessionExpired } })
    }
  }, [workerToken, authLoading, navigate, sessionExpired])

  useEffect(() => {
    const fetchCases = async () => {
      if (!workerToken) return

      try {
        const res = await fetch('/api/workers/my-cases', {
          headers: { Authorization: `Bearer ${workerToken}` }
        })

        if (!res.ok) {
          if (res.status === 401) {
            setWorkerToken(null)
            navigate('/trabajador/login')
            return
          }
          throw new Error('Error al cargar solicitudes')
        }

        const data = await res.json()
        setCases(data.cases)
      } catch (err) {
        setError('Error al cargar tus solicitudes')
      } finally {
        setLoading(false)
      }
    }

    if (workerToken && !authLoading) {
      fetchCases()
    }
  }, [workerToken, authLoading, navigate, setWorkerToken])

  function handleLogout() {
    setWorkerToken(null)
    navigate('/')
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Sin fecha'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="glass rounded-xl shadow-md p-8 text-center animate-fadeIn">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando tus solicitudes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="glass rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              📋 Mis Solicitudes
            </h1>
            {workerProfile && (
              <p className="text-gray-600 text-sm mt-1">
                👤 {workerProfile.trabajador?.nombre || workerProfile.email}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          ❌ {error}
        </div>
      )}

      {/* Empty state */}
      {cases.length === 0 && (
        <div className="glass rounded-xl shadow-md p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">📭</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No tienes solicitudes</h2>
          <p className="text-gray-600 mb-4">
            Aún no has enviado ninguna consulta sindical.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            📝 Enviar una solicitud
          </button>
        </div>
      )}

      {/* Cases list */}
      {cases.length > 0 && (
        <div className="space-y-4">
          {cases.map(caso => {
            const estado = estadoConfig[caso.estado || 'pendiente'] || estadoConfig.pendiente
            const tipo = tipoConfig[caso.tipo_problema || 'otro'] || tipoConfig.otro

            return (
              <div
                key={caso.id}
                className="glass rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${estado.bg} ${estado.color}`}>
                      {estado.icon} {estado.label}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {tipo.icon} {tipo.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    📅 {formatDate(caso.fecha_creacion)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {caso.descripcion.length > 300
                      ? caso.descripcion.substring(0, 300) + '...'
                      : caso.descripcion}
                  </p>
                </div>

                {caso.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {caso.attachments.map(att => (
                      <span
                        key={att.id}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs flex items-center gap-1"
                      >
                        📎 {att.filename}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Solicitud #{caso.id}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          💡 <strong>¿Tienes dudas?</strong> Un representante sindical te contactará para dar seguimiento a tu caso.
          Los estados de las solicitudes se actualizan conforme avanza el proceso.
        </p>
      </div>
    </div>
  )
}
