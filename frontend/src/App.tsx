import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Admin/Login'
import AdminLayout from './pages/Admin/AdminLayout'
import AuthGuard from './components/AuthGuard'
import Products from './pages/Admin/Products'
import Announcement from './pages/Admin/Announcement'
import Settings from './pages/Admin/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Redirect /admin to /admin/products */}
        <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
        
        <Route path="/admin/login" element={<Login />} />
        
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <AdminLayout />
            </AuthGuard>
          }
        >
          <Route path="products" element={<Products />} />
          <Route path="announcement" element={<Announcement />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
