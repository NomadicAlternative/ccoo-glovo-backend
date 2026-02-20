import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import Modal from '../components/Modal'

const categorias = [
  { value: 'DESPIDO', label: '🚫 Despido', description: 'Despido improcedente o sin causa justificada' },
  { value: 'SANCION', label: '⚠️ Sanción', description: 'Sanción disciplinaria injusta' },
  { value: 'VACACIONES', label: '🏖️ Vacaciones', description: 'Problemas con días de descanso o vacaciones' },
  { value: 'IMPAGO', label: '💰 Impago', description: 'Retrasos o falta de pago de salarios' },
  { value: 'OTRO', label: '📋 Otro', description: 'Otros problemas laborales' }
]

export default function Submit() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '',
    category: 'DESPIDO', 
    subject: '', 
    message: '' 
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const validatePassword = (password: string): string | null => {
    if (password.length < 5) {
      return 'La contraseña debe tener al menos 5 caracteres'
    }
    if (!/\d/.test(password)) {
      return 'La contraseña debe contener al menos un número'
    }
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password
    const pwError = validatePassword(form.password)
    if (pwError) {
      setPasswordError(pwError)
      return
    }
    setPasswordError(null)
    
    setStatus('sending')
    try {
      const res = await axios.post('/api/submissions', form)
      setPublicToken(res.data.publicToken)
      if (res.data.isNewWorker) {
        setCredentials({ username: form.email, password: form.password })
      }
      setStatus('ok')
      setShowSuccessModal(true)
    } catch (err: any) {
      setStatus('error')
    }
  }

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', password: '', category: 'DESPIDO', subject: '', message: '' })
    setStatus('idle')
    setPublicToken(null)
    setCredentials(null)
    setShowSuccessModal(false)
    setPasswordError(null)
  }

  const selectedCategory = categorias.find(c => c.value === form.category)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Encabezado */}
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-full mb-3 md:mb-4">
          <span className="text-2xl md:text-3xl">📝</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          Enviar una Consulta
        </h2>
        <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto">
          Completa el formulario y un representante del sindicato revisará tu caso de forma confidencial.
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={submit} className="glass rounded-2xl shadow-xl p-5 md:p-8 space-y-5 md:space-y-6 card-hover">
        {/* Datos personales */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="text-lg">👤</span>
            <h3 className="text-base md:text-lg font-semibold text-gray-700">
              Tus datos
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                Nombre completo *
              </label>
              <input 
                type="text"
                placeholder="Ej: María García"
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required
                className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
              />
            </div>
            
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                Email *
              </label>
              <input 
                type="email"
                placeholder="tu@email.com"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                required
                className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">📧 Este será tu usuario para acceder</p>
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
              Contraseña *
            </label>
            <input 
              type="password"
              placeholder="Mínimo 5 caracteres con al menos 1 número"
              value={form.password} 
              onChange={e => {
                setForm({ ...form, password: e.target.value })
                if (passwordError) setPasswordError(null)
              }} 
              required
              className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white ${
                passwordError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
              }`}
            />
            {passwordError && (
              <p className="text-xs text-red-500 mt-1">⚠️ {passwordError}</p>
            )}
            {!passwordError && (
              <p className="text-xs text-gray-500 mt-1">🔒 Guarda esta contraseña para ver el estado de tus solicitudes</p>
            )}
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
              Teléfono (opcional)
            </label>
            <input 
              type="tel"
              placeholder="612 345 678"
              value={form.phone} 
              onChange={e => setForm({ ...form, phone: e.target.value })} 
              className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Tipo de problema - Dropdown personalizado */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="text-lg">📂</span>
            <h3 className="text-base md:text-lg font-semibold text-gray-700">
              Tipo de consulta
            </h3>
          </div>
          <div className="relative" ref={dropdownRef}>
            {/* Botón del dropdown */}
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl cursor-pointer transition-all pr-10 text-left flex items-center ${
                dropdownOpen 
                  ? 'border-blue-500 ring-2 ring-blue-500 bg-white' 
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-white'
              }`}
            >
              <span>{selectedCategory?.label}</span>
            </button>
            
            {/* Icono flecha */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg 
                className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Menú desplegable */}
            {dropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-slideDown">
                {categorias.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, category: cat.value })
                      setDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-3 md:px-5 md:py-4 text-sm md:text-base text-left hover:bg-blue-50 transition-colors flex flex-col gap-0.5 border-b border-gray-100 last:border-b-0 ${
                      form.category === cat.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{cat.label}</span>
                    <span className="text-xs text-gray-500">{cat.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Descripción de la categoría seleccionada */}
          <p className="text-xs md:text-sm text-gray-500 mt-1 flex items-center gap-1">
            <span className="text-blue-500">ℹ️</span>
            {selectedCategory?.description}
          </p>
        </div>

        {/* Descripción del caso */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="text-lg">✍️</span>
            <h3 className="text-base md:text-lg font-semibold text-gray-700">
              Descripción del caso
            </h3>
          </div>
          
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
              Asunto *
            </label>
            <input 
              type="text"
              placeholder="Resumen breve de tu consulta"
              value={form.subject} 
              onChange={e => setForm({ ...form, subject: e.target.value })} 
              required
              className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
              Describe tu situación *
            </label>
            <textarea 
              placeholder="Explica lo que ha sucedido con el mayor detalle posible..."
              value={form.message} 
              onChange={e => setForm({ ...form, message: e.target.value })} 
              required
              rows={5}
              className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Error */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">❌</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">Error al enviar la solicitud</p>
              <p className="text-xs text-red-600 mt-0.5">Verifica que todos los campos estén completos e inténtalo de nuevo.</p>
            </div>
          </div>
        )}

        {/* Botón enviar */}
        <button 
          type="submit"
          disabled={status === 'sending'}
          className={`w-full py-3.5 md:py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
            status === 'sending'
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
          }`}
        >
          {status === 'sending' ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Enviando solicitud...
            </>
          ) : (
            <>
              <span>📤</span>
              <span>Enviar solicitud</span>
            </>
          )}
        </button>
      </form>

      {/* Modal de éxito */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => {}} 
        size="sm"
        showCloseButton={false}
      >
        <div className="text-center">
          {/* Icono */}
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
            <span className="text-2xl md:text-3xl">✅</span>
          </div>

          {/* Título */}
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
            ¡Solicitud enviada!
          </h3>

          {/* Mensaje */}
          <p className="text-sm md:text-base text-gray-600 mb-4">
            Tu consulta ha sido recibida correctamente. Un representante la revisará pronto.
          </p>

          {/* Credenciales si es nuevo usuario */}
          {credentials && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔑</span>
                <h4 className="font-semibold text-blue-800 text-sm">Tus credenciales de acceso</h4>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                Se ha creado una cuenta para que puedas seguir el estado de tus consultas. <strong>¡Guarda estos datos!</strong>
              </p>
              <div className="space-y-2 bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">👤 Usuario:</span>
                  <span className="font-mono font-medium text-gray-800">{credentials.username}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">🔒 Contraseña:</span>
                  <span className="font-mono font-medium text-gray-800">La que elegiste</span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-3 text-center bg-blue-100 rounded-lg py-2">
                � Accede en <strong>"👷 Acceso Trabajador"</strong> para ver tus solicitudes
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col gap-2 md:gap-3">
            <a
              href={`/case/${publicToken}`}
              className="w-full px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors text-center"
            >
              Ver estado de mi caso
            </a>
            <button
              onClick={resetForm}
              className="w-full px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Enviar otra consulta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
