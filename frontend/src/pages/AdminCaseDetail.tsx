import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ConfirmModal, AlertModal } from '../components/Modal'

// Opciones de estado para el dropdown
const estadoOptions = [
  { value: 'pendiente', label: '⏳ Pendiente', description: 'Solicitud recibida, pendiente de revisión' },
  { value: 'en_revision', label: '🔍 En revisión', description: 'Un representante está revisando el caso' },
  { value: 'en_proceso', label: '🔄 En proceso', description: 'Se están realizando gestiones' },
  { value: 'resuelto', label: '✅ Resuelto', description: 'El caso ha sido resuelto satisfactoriamente' },
  { value: 'cerrado', label: '📁 Cerrado', description: 'Caso cerrado sin más acciones' }
]

// Mapeo de estados a texto legible y colores
const estadoLabels: Record<string, { text: string; color: string }> = {
  pendiente: { text: '⏳ Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  en_revision: { text: '🔍 En revisión', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  en_proceso: { text: '🔄 En proceso', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  resuelto: { text: '✅ Resuelto', color: 'bg-green-100 text-green-800 border-green-300' },
  cerrado: { text: '📁 Cerrado', color: 'bg-gray-100 text-gray-800 border-gray-300' }
}

// Mapeo de categorías a texto legible
const categoriaLabels: Record<string, { text: string; icon: string }> = {
  despido: { text: 'Despido', icon: '🚫' },
  sancion: { text: 'Sanción disciplinaria', icon: '⚠️' },
  vacaciones: { text: 'Problema con vacaciones', icon: '🏖️' },
  impago: { text: 'Impago de salarios', icon: '💰' },
  otro: { text: 'Otro problema laboral', icon: '📋' }
}

interface Attachment {
  id: number
  filename: string
  url: string
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
  attachments?: Attachment[]
}

export default function AdminCaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [caso, setCaso] = useState<Caso | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState<string>('')
  
  // Estados para modales
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [deleting, setDeleting] = useState(false)
  
  // Estado para dropdown de estado
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false)
  const estadoDropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (estadoDropdownRef.current && !estadoDropdownRef.current.contains(event.target as Node)) {
        setEstadoDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    cargarCaso()
  }, [id])

  async function cargarCaso() {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`/api/submissions/${id}`)
      setCaso(res.data.caso)
      setNuevoEstado(res.data.caso.estado)
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Debes iniciar sesión para ver este caso')
      } else if (err.response?.status === 403) {
        setError('No tienes permisos para ver este caso')
      } else if (err.response?.status === 404) {
        setError('El caso no existe')
      } else {
        setError('Error al cargar el caso')
      }
    } finally {
      setLoading(false)
    }
  }

  async function cambiarEstado() {
    if (!caso || nuevoEstado === caso.estado) return
    setCambiandoEstado(true)
    try {
      await axios.patch(`/api/submissions/${id}`, { estado: nuevoEstado })
      setCaso({ ...caso, estado: nuevoEstado })
      setModalMessage('El estado de la solicitud ha sido actualizado correctamente.')
      setShowSuccessModal(true)
    } catch (err) {
      setModalMessage('No se pudo cambiar el estado de la solicitud. Por favor, inténtalo de nuevo.')
      setShowErrorModal(true)
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function confirmarEliminar() {
    if (!caso) return
    setDeleting(true)
    try {
      await axios.delete(`/api/submissions/${id}`)
      setShowDeleteModal(false)
      setModalMessage('El caso ha sido eliminado permanentemente.')
      setShowSuccessModal(true)
      // Navegar después de cerrar el modal
      setTimeout(() => navigate('/admin/casos'), 1500)
    } catch (err: any) {
      setShowDeleteModal(false)
      if (err.response?.status === 403) {
        setModalMessage('No tienes permisos para eliminar casos. Solo los administradores pueden hacerlo.')
      } else {
        setModalMessage('No se pudo eliminar el caso. Por favor, inténtalo de nuevo.')
      }
      setShowErrorModal(true)
    } finally {
      setDeleting(false)
    }
  }

  function formatearFecha(fecha: string) {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando información del caso...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-700 font-medium">{error}</p>
        <Link to="/admin/casos" className="mt-4 inline-block text-blue-600 underline">
          Volver a la lista de casos
        </Link>
      </div>
    )
  }

  if (!caso) return null

  const estadoInfo = estadoLabels[caso.estado] || { text: caso.estado, color: 'bg-gray-100' }
  const categoriaInfo = categoriaLabels[caso.tipo_problema] || { text: caso.tipo_problema, icon: '📋' }

  // Separar asunto y mensaje de la descripción (formato: "asunto -- mensaje")
  const [asunto, ...mensajeParts] = caso.descripcion.split(' -- ')
  const mensaje = mensajeParts.join(' -- ')

  return (
    <div>
      {/* Navegación */}
      <div className="mb-6">
        <Link to="/admin/casos" className="text-blue-600 hover:underline flex items-center gap-1">
          ← Volver a la lista de solicitudes
        </Link>
      </div>

      {/* Encabezado */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Solicitud #{caso.id}
            </h1>
            <p className="text-gray-500 mt-1">
              📅 Recibida el {formatearFecha(caso.fecha_creacion)}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg border-2 ${estadoInfo.color}`}>
            <span className="text-lg font-medium">{estadoInfo.text}</span>
          </div>
        </div>

        <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-lg">
          <span className="text-lg mr-1">{categoriaInfo.icon}</span>
          <span className="font-medium">{categoriaInfo.text}</span>
        </div>
      </div>

      {/* Información del solicitante */}
      {caso.trabajadores && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            👤 Información del Solicitante
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Nombre completo</div>
              <div className="text-lg font-medium">{caso.trabajadores.nombre}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Correo electrónico</div>
              <div className="text-lg">
                <a href={`mailto:${caso.trabajadores.email}`} className="text-blue-600 hover:underline">
                  📧 {caso.trabajadores.email}
                </a>
              </div>
            </div>
            {caso.trabajadores.telefono && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Teléfono</div>
                <div className="text-lg">
                  <a href={`tel:${caso.trabajadores.telefono}`} className="text-blue-600 hover:underline">
                    📞 {caso.trabajadores.telefono}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Descripción del problema */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          📝 Descripción del Problema
        </h2>
        {mensaje ? (
          <>
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Asunto</div>
              <div className="text-lg font-medium">{asunto}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Mensaje detallado</div>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-800 whitespace-pre-wrap">
                {mensaje}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-gray-800 whitespace-pre-wrap">
            {caso.descripcion}
          </div>
        )}
      </div>

      {/* Archivos adjuntos */}
      {caso.attachments && caso.attachments.length > 0 && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            📎 Documentos Adjuntos ({caso.attachments.length})
          </h2>
          <div className="space-y-2">
            {caso.attachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <div className="font-medium">{att.filename}</div>
                </div>
                <a
                  href={`/api/attachments/${att.id}/download`}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ⬇️ Descargar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cambiar estado */}
      <div className="glass rounded-xl p-6 mb-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>⚙️</span> Gestión del Caso
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm text-gray-600 mb-2">
              Cambiar estado de la solicitud:
            </label>
            {/* Dropdown personalizado */}
            <div className="relative" ref={estadoDropdownRef}>
              <button
                type="button"
                onClick={() => setEstadoDropdownOpen(!estadoDropdownOpen)}
                className={`w-full px-4 py-3 text-sm md:text-base border rounded-xl cursor-pointer transition-all pr-10 text-left flex items-center ${
                  estadoDropdownOpen 
                    ? 'border-blue-500 ring-2 ring-blue-500 bg-white' 
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-white'
                }`}
              >
                <span>{estadoOptions.find(o => o.value === nuevoEstado)?.label || 'Seleccionar estado'}</span>
              </button>
              
              {/* Icono flecha */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${estadoDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Menú desplegable */}
              {estadoDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-slideDown">
                  {estadoOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setNuevoEstado(option.value)
                        setEstadoDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-3 text-sm md:text-base text-left hover:bg-blue-50 transition-colors flex flex-col gap-0.5 border-b border-gray-100 last:border-b-0 ${
                        nuevoEstado === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={cambiarEstado}
            disabled={cambiandoEstado || nuevoEstado === caso.estado}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              nuevoEstado === caso.estado
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg'
            }`}
          >
            {cambiandoEstado ? 'Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>
        {nuevoEstado !== caso.estado && (
          <p className="mt-3 text-sm text-orange-600">
            ⚠️ Tienes cambios sin guardar
          </p>
        )}
      </div>

      {/* Zona de peligro - Eliminar */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-red-800 mb-2">
          🗑️ Zona de Peligro
        </h2>
        <p className="text-red-700 text-sm mb-4">
          Eliminar este caso permanentemente. Esta acción <strong>no se puede deshacer</strong> y 
          se borrarán todos los archivos adjuntos asociados.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center gap-2"
        >
          🗑️ Eliminar este caso
        </button>
      </div>

      {/* Modales */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmarEliminar}
        title="Eliminar caso permanentemente"
        message={`¿Estás seguro de que quieres eliminar el caso #${caso.id}?\n\nTipo: ${categoriaLabels[caso.tipo_problema]?.text || caso.tipo_problema}\nTrabajador: ${caso.trabajadores?.nombre || 'Desconocido'}\n\nEsta acción no se puede deshacer y se eliminarán todos los archivos adjuntos.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
      />

      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Operación exitosa!"
        message={modalMessage}
        type="success"
      />

      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={modalMessage}
        type="error"
      />
    </div>
  )
}
