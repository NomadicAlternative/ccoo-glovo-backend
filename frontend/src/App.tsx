import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Submit from './pages/Submit'
import PublicView from './pages/PublicView'
import Login from './pages/Login'
import AdminTokens from './pages/AdminTokens'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="max-w-3xl mx-auto p-4">
          <header className="mb-6">
            <h1 className="text-2xl font-bold">CCOO Glovo</h1>
            <nav className="mt-2">
              <Link to="/">Enviar caso</Link> | <Link to="/login">Admin</Link>
            </nav>
          </header>
          <Routes>
            <Route path="/" element={<Submit />} />
            <Route path="/case/:token" element={<PublicView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/tokens" element={<AdminTokens />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
