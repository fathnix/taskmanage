import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import {
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
];

export function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="Open navigation"
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <Link to="/dashboard">
                <Logo />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-neutral-600">
                {user?.name}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <UserIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-neutral-900/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-neutral-200 transition-transform duration-200 md:sticky md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200 md:hidden">
            <Logo />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
              aria-label="Close navigation"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-neutral-900">Welcome back, {user?.name}!</h1>
          <p className="mt-2 text-neutral-600">Here's what's happening with your tasks today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" padding="lg" className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Total Tasks</p>
                <p className="mt-1 text-3xl font-bold text-neutral-900">24</p>
              </div>
              <div className="p-3 bg-pastel-blue-100 rounded-xl text-pastel-blue-600">
                <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Completed</p>
                <p className="mt-1 text-3xl font-bold text-neutral-900">18</p>
              </div>
              <div className="p-3 bg-pastel-green-100 rounded-xl text-pastel-green-600">
                <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg" className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">In Progress</p>
                <p className="mt-1 text-3xl font-bold text-neutral-900">4</p>
              </div>
              <div className="p-3 bg-pastel-orange-100 rounded-xl text-pastel-orange-600">
                <ClockIcon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg" className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Overdue</p>
                <p className="mt-1 text-3xl font-bold text-neutral-900">2</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl text-red-600">
                <XCircleIcon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Your latest tasks and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'Design new landing page', status: 'in-progress', due: 'Today', project: 'Website Redesign' },
                    { title: 'Write API documentation', status: 'completed', due: 'Yesterday', project: 'Backend API' },
                    { title: 'Fix authentication bug', status: 'completed', due: '2 days ago', project: 'User Auth' },
                    { title: 'Setup CI/CD pipeline', status: 'pending', due: 'Tomorrow', project: 'DevOps' },
                    { title: 'Code review for PR #242', status: 'in-progress', due: 'Today', project: 'Mobile App' },
                  ].map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-neutral-200">
                          <CheckCircleIcon className="h-5 w-5 text-pastel-green-500" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{task.title}</p>
                          <p className="text-sm text-neutral-500">{task.project} · Due {task.due}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-pastel-green-100 text-pastel-green-700' :
                        task.status === 'in-progress' ? 'bg-pastel-blue-100 text-pastel-blue-700' :
                        'bg-neutral-100 text-neutral-700'
                      }`}>
                        {task.status === 'completed' && 'Completed'}
                        {task.status === 'in-progress' && 'In Progress'}
                        {task.status === 'pending' && 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks you can perform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="primary" className="w-full justify-start gap-3">
                    <PlusIcon className="h-5 w-5" aria-hidden="true" />
                    Create New Task
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-3">
                    <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <UserIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                      <p className="text-sm text-neutral-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <Cog6ToothIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Member since</p>
                      <p className="text-sm text-neutral-500">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}