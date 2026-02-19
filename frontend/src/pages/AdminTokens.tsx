import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface TokenInfo {
  id: number
  tokenId: string
  userId: number
  userEmail: string
  userName: string | null
  revoked: boolean
  expiresAt: string
  createdAt: string
}

export default function AdminTokens() {
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmRevoke, setConfirmRevoke] = useState<number | null>(null)

  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/admin/refresh-tokens?status=all')
      setTokens(r.data.tokens)
    } catch {
      setTokens([])
    }
    setLoading(false)
  }

  const revoke = async (id: number) => {
    await axios.post(`/api/admin/refresh-tokens/${id}/revoke`)
    setConfirmRevoke(null)
    loadTokens()
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Sin fecha'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return 'Sin fecha'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (dateStr: string) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  const getStatusInfo = (token: TokenInfo) => {
    if (token.revoked) {
      return { label: 'Cerrada', color: 'text-red-600 bg-red-50', dot: 'bg-red-500' }
    }
    if (isExpired(token.expiresAt)) {
      return { label: 'Expirada', color: 'text-yellow-600 bg-yellow-50', dot: 'bg-yellow-500' }
    }
    return { label: 'Activa', color: 'text-green-600 bg-green-50', dot: 'bg-green-500' }
  }

  const activeSessions = tokens.filter(t => !t.revoked && !isExpired(t.expiresAt)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-sm text-gray-500">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Gestión de Sesiones</h2>
        <span className="text-xs md:text-sm text-gray-500">
          {activeSessions} activa{activeSessions !== 1 ? 's' : ''}
        </span>
      </div>

      {tokens.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">No hay sesiones registradas</p>
        </div>
      ) : (
        <>
          {/* Vista móvil - Tarjetas */}
          <div className="md:hidden space-y-3">
            {tokens.map(token => {
              const status = getStatusInfo(token)
              return (
                <div key={token.id} className="bg-white rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      {token.userName && (
                        <p className="text-sm font-medium text-gray-800 truncate">{token.userName}</p>
                      )}
                      <p className="text-xs text-gray-500 truncate">{token.userEmail}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Inicio: {formatDateShort(token.createdAt)}</span>
                    <span className={isExpired(token.expiresAt) ? 'text-red-500' : ''}>
                      Exp: {formatDateShort(token.expiresAt)}
                    </span>
                  </div>

                  {!token.revoked && (
                    <div className="pt-2 border-t border-gray-100">
                      {confirmRevoke === token.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => revoke(token.id)}
                            className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmRevoke(null)}
                            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRevoke(token.id)}
                          className="w-full px-3 py-1.5 text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          Cerrar sesión
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Vista desktop - Tabla */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Usuario</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Estado</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Iniciada</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Expira</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tokens.map(token => {
                  const status = getStatusInfo(token)
                  return (
                    <tr key={token.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div>
                          {token.userName && (
                            <span className="text-gray-800 font-medium">{token.userName}</span>
                          )}
                          <span className={`text-gray-500 ${token.userName ? 'block text-xs' : ''}`}>
                            {token.userEmail}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {formatDate(token.createdAt)}
                      </td>
                      <td className={`px-4 py-2.5 ${isExpired(token.expiresAt) ? 'text-red-500' : 'text-gray-500'}`}>
                        {formatDate(token.expiresAt)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {!token.revoked && (
                          confirmRevoke === token.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => revoke(token.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmRevoke(null)}
                                className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRevoke(token.id)}
                              className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors"
                            >
                              Cerrar sesión
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}