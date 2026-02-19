import React from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Submit from './pages/Submit'
import PublicView from './pages/PublicView'
import Login from './pages/Login'
import AdminTokens from './pages/AdminTokens'
import AdminUsers from './pages/AdminUsers'
import AdminCases from './pages/AdminCases'
import AdminCaseDetail from './pages/AdminCaseDetail'
import { AuthProvider, useAuth } from './context/AuthContext'

function Navigation() {
  const { accessToken, setAccessToken } = useAuth()
  const location = useLocation()

  function handleLogout() {
    setAccessToken(null)
  }

  return (
    <header className="glass rounded-xl shadow-sm mb-6 md:mb-8 animate-fadeIn">
      <div className="p-4 md:p-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img 
            src="/logo-transparent.png" 
            alt="CCOO Glovo - Sindicato Glovo" 
            className="h-14 md:h-18 lg:h-22 w-auto drop-shadow-sm"
          />
        </div>
        
        {/* Navigation */}
        <nav className="flex flex-wrap justify-center gap-1 md:gap-2 items-center">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
              location.pathname === '/' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            📝 <span className="hidden sm:inline">Enviar </span>Solicitud
          </Link>
          
          {accessToken ? (
            <>
              <Link
                to="/admin/casos"
                className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                  location.pathname.startsWith('/admin/casos') 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                📋 <span className="hidden sm:inline">Panel de </span>Solicitudes
              </Link>
              <Link
                to="/admin/tokens"
                className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/admin/tokens' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                🔑 Sesiones
              </Link>
              <Link
                to="/admin/usuarios"
                className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/admin/usuarios' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                👥 Usuarios
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              >
                🚪 <span className="hidden sm:inline">Cerrar sesión</span><span className="sm:hidden">Salir</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                location.pathname === '/login' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              🔐 <span className="hidden sm:inline">Acceso </span>Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-8 md:mt-12 py-6 border-t border-gray-200">
      <div className="text-center">
        <p className="text-xs md:text-sm text-gray-500 mb-2">
          🔒 Tus datos están protegidos y son tratados de forma confidencial
        </p>
        <p className="text-xs text-gray-400 mb-1">
          © {new Date().getFullYear()} CCOO Glovo · Sección Sindical
        </p>
        <p className="text-xs text-gray-400">
          Developed by Diego García | Nomadic Alternative
        </p>
      </div>
    </footer>
  )
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow max-w-4xl mx-auto w-full px-3 py-4 md:px-4 md:py-6">
        <Navigation />
        <main className="animate-fadeIn">
          <Routes>
            <Route path="/" element={<Submit />} />
            <Route path="/case/:token" element={<PublicView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/casos" element={<AdminCases />} />
            <Route path="/admin/casos/:id" element={<AdminCaseDetail />} />
            <Route path="/admin/tokens" element={<AdminTokens />} />
            <Route path="/admin/usuarios" element={<AdminUsers />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}
