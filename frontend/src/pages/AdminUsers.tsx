import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface UserInfo {
  id: number
  email: string
  name: string | null
  role: string
  createdAt: string
  _count: {
    refreshTokens: number
  }
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/admin/users')
      setUsers(r.data.users)
    } catch {
      setUsers([])
    }
    setLoading(false)
  }

  const deleteUser = async (id: number) => {
    try {
      await axios.delete(`/api/admin/users/${id}`)
      setConfirmDelete(null)
      setError(null)
      loadUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar usuario')
      setConfirmDelete(null)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Sin fecha'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return 'bg-purple-100 text-purple-700'
    }
    return 'bg-blue-100 text-blue-700'
  }

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Gestión de Usuarios</h2>
        <span className="text-xs md:text-sm text-gray-500">
          {users.length} usuario{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">No hay usuarios registrados</p>
        </div>
      ) : (
        <>
          {/* Vista móvil - Tarjetas */}
          <div className="md:hidden space-y-3">
            {users.map(user => (
              <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    {user.name && (
                      <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Creado: {formatDate(user.createdAt)}</span>
                  <span>{user._count.refreshTokens} sesión{user._count.refreshTokens !== 1 ? 'es' : ''}</span>
                </div>

                {user.role !== 'ADMIN' && (
                  <div className="pt-2 border-t border-gray-100">
                    {confirmDelete === user.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="w-full px-3 py-1.5 text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        Eliminar usuario
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Vista desktop - Tabla */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Usuario</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Rol</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Creado</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Sesiones</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div>
                        {user.name && (
                          <span className="text-gray-800 font-medium">{user.name}</span>
                        )}
                        <span className={`text-gray-500 ${user.name ? 'block text-xs' : ''}`}>
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {user._count.refreshTokens}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {user.role === 'ADMIN' ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : confirmDelete === user.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
