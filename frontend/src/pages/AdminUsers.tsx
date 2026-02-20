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

interface WorkerInfo {
  id: number
  email: string
  nombre: string
  telefono: string
  createdAt: string
  casosCount: number
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [workers, setWorkers] = useState<WorkerInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [confirmDeleteWorker, setConfirmDeleteWorker] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'admins' | 'workers'>('workers')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, workersRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/workers')
      ])
      setUsers(usersRes.data.users)
      setWorkers(workersRes.data)
    } catch {
      setUsers([])
      setWorkers([])
    }
    setLoading(false)
  }

  const deleteUser = async (id: number) => {
    try {
      await axios.delete(`/api/admin/users/${id}`)
      setConfirmDelete(null)
      setError(null)
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar usuario')
      setConfirmDelete(null)
    }
  }

  const deleteWorker = async (id: number) => {
    try {
      await axios.delete(`/api/admin/workers/${id}`)
      setConfirmDeleteWorker(null)
      setError(null)
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar trabajador')
      setConfirmDeleteWorker(null)
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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('workers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'workers'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Trabajadores ({workers.length})
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'admins'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Administradores ({users.length})
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Workers Tab */}
      {activeTab === 'workers' && (
        <>
          {workers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500 text-sm">No hay trabajadores registrados</p>
            </div>
          ) : (
            <>
              {/* Vista móvil - Tarjetas Trabajadores */}
              <div className="md:hidden space-y-3">
                {workers.map(worker => (
                  <div key={worker.id} className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{worker.nombre}</p>
                        <p className="text-xs text-gray-500 truncate">{worker.email}</p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        {worker.casosCount} caso{worker.casosCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Tel: {worker.telefono}</span>
                      <span>Registro: {formatDate(worker.createdAt)}</span>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      {confirmDeleteWorker === worker.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteWorker(worker.id)}
                            className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteWorker(null)}
                            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteWorker(worker.id)}
                          className="w-full px-3 py-1.5 text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          Eliminar cuenta
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista desktop - Tabla Trabajadores */}
              <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">Nombre</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">Email</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">Teléfono</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">Registro</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">Casos</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {workers.map(worker => (
                      <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-800 font-medium">
                          {worker.nombre}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {worker.email}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {worker.telefono}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {formatDate(worker.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            {worker.casosCount}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {confirmDeleteWorker === worker.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => deleteWorker(worker.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteWorker(null)}
                                className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteWorker(worker.id)}
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
        </>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <>
          {users.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500 text-sm">No hay administradores registrados</p>
            </div>
          ) : (
            <>
              {/* Vista móvil - Tarjetas Admins */}
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

              {/* Vista desktop - Tabla Admins */}
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
        </>
      )}
    </div>
  )
}
