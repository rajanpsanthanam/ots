import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import Login from './pages/Login'
import CreateSecret from './pages/CreateSecret'
import ViewSecret from './pages/ViewSecret'
import { useAutoLogout } from './hooks/useAutoLogout'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" />
  }
  return children
}

function AuthenticatedLayout({ children }) {
  // Set up auto-logout
  useAutoLogout()

  return children
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/secrets/:id" element={<ViewSecret />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <CreateSecret />
                </AuthenticatedLayout>
              </PrivateRoute>
            }
          />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App
