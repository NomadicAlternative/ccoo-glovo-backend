import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

// Opciones de filtro de estado
const estadoFilterOptions = [
  { value: 'todos', label: '📊 Todos los estados' },
  { value: 'pendiente', label: '⏳ Pendiente' },
  { value: 'en_revision', label: '🔍 En revisión' },
  { value: 'en_proceso', label: '🔄 En proceso' },
  { value: 'resuelto', label: '✅ Resuelto' },
  { value: 'cerrado', label: '📁 Cerrado' }
]

// Opciones de filtro de categoría
const categoriaFilterOptions = [
  { value: 'todos', label: '📂 Todos los tipos' },
  { value: 'despido', label: '🚫 Despido' },
  { value: 'sancion', label: '⚠️ Sanción' },
  { value: 'vacaciones', label: '🏖️ Vacaciones' },
  { value: 'impago', label: '💰 Impago' },
  { value: 'otro', label: '📋 Otro' }
]

// Mapeo de estados a texto legible y colores
const estadoLabels: Record<string, { text: string; color: string }> = {
  pendiente: { text: '⏳ Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  en_revision: { text: '🔍 En revisión', color: 'bg-orange-100 text-orange-800' },
  en_proceso: { text: '🔄 En proceso', color: 'bg-blue-100 text-blue-800' },
  resuelto: { text: '✅ Resuelto', color: 'bg-green-100 text-green-800' },
  cerrado: { text: '📁 Cerrado', color: 'bg-gray-100 text-gray-800' }
}

// Mapeo de categorías a texto legible
const categoriaLabels: Record<string, string> = {
  despido: '🚫 Despido',
  sancion: '⚠️ Sanción',
  vacaciones: '🏖️ Vacaciones',
  impago: '💰 Impago',
  otro: '📋 Otro'
}

interface Trabajador {
  id: number
  nombre: string
  email: string
  telefono?: string
}

interface Caso {
  id: number
  tipo_problema: string
  descripcion: string
  estado: string
  fecha_creacion: string
  trabajadores?: Trabajador
}

export default function AdminCases() {
  const [casos, setCasos] = useState<Caso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  
  // Estados para dropdowns
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false)
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false)
  const estadoDropdownRef = useRef<HTMLDivElement>(null)
  const categoriaDropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (estadoDropdownRef.current && !estadoDropdownRef.current.contains(event.target as Node)) {
        setEstadoDropdownOpen(false)
      }
      if (categoriaDropdownRef.current && !categoriaDropdownRef.current.contains(event.target as Node)) {
        setCategoriaDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    cargarCasos()
  }, [])

  async function cargarCasos() {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get('/api/submissions')
      setCasos(res.data.items || [])
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Debes iniciar sesión para ver los casos')
      } else if (err.response?.status === 403) {
        setError('No tienes permisos para ver los casos')
      } else {
        setError('Error al cargar los casos')
      }
    } finally {
      setLoading(false)
    }
  }

  // Filtrar casos
  const casosFiltrados = casos.filter(c => {
    if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false
    if (filtroCategoria !== 'todos' && c.tipo_problema !== filtroCategoria) return false
    return true
  })

  // Formatear fecha de manera legible
  function formatearFecha(fecha: string) {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-red-700 font-semibold mb-2">{error}</p>
        <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          🔐 Ir a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-full mb-3">
          <span className="text-2xl md:text-3xl">📋</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          Panel de Solicitudes
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Gestiona las solicitudes de los trabajadores de forma sencilla.
        </p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center card-hover border border-yellow-200">
          <div className="text-2xl md:text-3xl font-bold text-yellow-600">
            {casos.filter(c => c.estado === 'pendiente').length}
          </div>
          <div className="text-xs md:text-sm text-yellow-700 font-medium mt-1">⏳ Pendientes</div>
        </div>
        <div className="glass rounded-xl p-4 text-center card-hover border border-blue-200">
          <div className="text-2xl md:text-3xl font-bold text-blue-600">
            {casos.filter(c => c.estado === 'en_proceso').length}
          </div>
          <div className="text-xs md:text-sm text-blue-700 font-medium mt-1">🔄 En proceso</div>
        </div>
        <div className="glass rounded-xl p-4 text-center card-hover border border-green-200">
          <div className="text-2xl md:text-3xl font-bold text-green-600">
            {casos.filter(c => c.estado === 'resuelto').length}
          </div>
          <div className="text-xs md:text-sm text-green-700 font-medium mt-1">✅ Resueltos</div>
        </div>
        <div className="glass rounded-xl p-4 text-center card-hover border border-gray-200">
          <div className="text-2xl md:text-3xl font-bold text-gray-700">{casos.length}</div>
          <div className="text-xs md:text-sm text-gray-600 font-medium mt-1">📊 Total</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass rounded-xl p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Dropdown de estado */}
          <div className="min-w-[180px]">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Filtrar por estado:
            </label>
            <div className="relative" ref={estadoDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setEstadoDropdownOpen(!estadoDropdownOpen)
                  setCategoriaDropdownOpen(false)
                }}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl cursor-pointer transition-all pr-8 text-left flex items-center ${
                  estadoDropdownOpen 
                    ? 'border-blue-500 ring-2 ring-blue-500 bg-white' 
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-white'
                }`}
              >
                <span>{estadoFilterOptions.find(o => o.value === filtroEstado)?.label}</span>
              </button>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${estadoDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {estadoDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-slideDown">
                  {estadoFilterOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFiltroEstado(option.value)
                        setEstadoDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        filtroEstado === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Dropdown de categoría */}
          <div className="min-w-[180px]">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Filtrar por tipo:
            </label>
            <div className="relative" ref={categoriaDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setCategoriaDropdownOpen(!categoriaDropdownOpen)
                  setEstadoDropdownOpen(false)
                }}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl cursor-pointer transition-all pr-8 text-left flex items-center ${
                  categoriaDropdownOpen 
                    ? 'border-blue-500 ring-2 ring-blue-500 bg-white' 
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-white'
                }`}
              >
                <span>{categoriaFilterOptions.find(o => o.value === filtroCategoria)?.label}</span>
              </button>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${categoriaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {categoriaDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-slideDown">
                  {categoriaFilterOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFiltroCategoria(option.value)
                        setCategoriaDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        filtroCategoria === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={cargarCasos}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium shadow-sm hover:shadow-md"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de casos */}
      {casosFiltrados.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📭</span>
          </div>
          <p className="text-gray-600 font-medium">No hay solicitudes que mostrar con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {casosFiltrados.map(caso => {
            const estadoInfo = estadoLabels[caso.estado] || { text: caso.estado, color: 'bg-gray-100' }
            const categoriaLabel = categoriaLabels[caso.tipo_problema] || caso.tipo_problema

            return (
              <div
                key={caso.id}
                className="glass rounded-xl p-4 md:p-5 border border-gray-200 card-hover"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base md:text-lg font-bold text-gray-800">
                      Solicitud #{caso.id}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${estadoInfo.color}`}>
                      {estadoInfo.text}
                    </span>
                  </div>
                  <span className="text-xs md:text-sm text-gray-500">
                    📅 {formatearFecha(caso.fecha_creacion)}
                  </span>
                </div>

                <div className="mb-3">
                  <span className="inline-block bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg text-sm font-medium">
                    {categoriaLabel}
                  </span>
                </div>

                {caso.trabajadores && (
                  <div className="bg-gray-50/80 rounded-lg p-3 mb-3 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">👤 Solicitante</div>
                    <div className="font-semibold text-gray-800">{caso.trabajadores.nombre}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      📧 {caso.trabajadores.email}
                      {caso.trabajadores.telefono && ` · 📞 ${caso.trabajadores.telefono}`}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">📝 Descripción</div>
                  <p className="text-sm md:text-base text-gray-700 line-clamp-2">
                    {caso.descripcion.length > 150
                      ? caso.descripcion.slice(0, 150) + '...'
                      : caso.descripcion}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/admin/casos/${caso.id}`}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
                  >
                    👁️ Ver detalles
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
