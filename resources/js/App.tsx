import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute, PublicRoute, RoleRoute } from '@/components/auth/Routes';
import { PROJECT_ROLES, TASK_ROLES, ADMIN_ROLES } from '@/utils/roles';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Projects } from '@/pages/Projects';
import { Users } from '@/pages/Users';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/users"
            element={
              <RoleRoute allowed={ADMIN_ROLES}>
                <Users />
              </RoleRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <RoleRoute allowed={TASK_ROLES}>
                <Dashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <RoleRoute allowed={PROJECT_ROLES}>
                <Projects />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}