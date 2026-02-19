import React, { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Cerrar con Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Cerrar al hacer clic fuera
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-xs md:max-w-sm',
    md: 'max-w-sm md:max-w-md',
    lg: 'max-w-md md:max-w-lg',
    xl: 'max-w-lg md:max-w-2xl'
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4"
      onClick={handleBackdropClick}
    >
      {/* Fondo difuminado */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
      />
      
      {/* Contenedor del modal */}
      <div 
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-white rounded-xl md:rounded-2xl shadow-2xl 
          transform transition-all duration-300 ease-out
          animate-modal-enter max-h-[90vh] overflow-y-auto
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-3 md:p-5 border-b border-gray-100">
            {title && (
              <h2 id="modal-title" className="text-base md:text-xl font-semibold text-gray-800">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Contenido */}
        <div className="p-3 md:p-5">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-enter {
          from { 
            opacity: 0; 
            transform: scale(0.95) translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// Componente de confirmación reutilizable
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info',
  loading = false
}: ConfirmModalProps) {
  const typeStyles = {
    danger: {
      icon: '🗑️',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    },
    success: {
      icon: '✅',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    }
  }

  const style = typeStyles[type]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        {/* Icono */}
        <div className={`mx-auto w-12 h-12 md:w-16 md:h-16 ${style.iconBg} rounded-full flex items-center justify-center mb-3 md:mb-4`}>
          <span className="text-2xl md:text-3xl">{style.icon}</span>
        </div>

        {/* Título */}
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Mensaje */}
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Botones */}
        <div className="flex gap-2 md:gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-2 md:px-5 md:py-2.5 text-sm md:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-3 py-2 md:px-5 md:py-2.5 text-sm md:text-base text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${style.button} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                ...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Componente de alerta/notificación
interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  buttonText?: string
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'Entendido'
}: AlertModalProps) {
  const typeStyles = {
    success: {
      icon: '✅',
      iconBg: 'bg-green-100',
      button: 'bg-green-600 hover:bg-green-700'
    },
    error: {
      icon: '❌',
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const style = typeStyles[type]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        {/* Icono */}
        <div className={`mx-auto w-12 h-12 md:w-16 md:h-16 ${style.iconBg} rounded-full flex items-center justify-center mb-3 md:mb-4`}>
          <span className="text-2xl md:text-3xl">{style.icon}</span>
        </div>

        {/* Título */}
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Mensaje */}
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Botón */}
        <button
          onClick={onClose}
          className={`w-full px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base text-white rounded-lg font-medium transition-colors ${style.button}`}
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  )
}
