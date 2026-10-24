import { useAuth } from '@/context/AuthContext';
import { UserApprovals } from '@/pages/UserApprovals';
import { UserManagement } from '@/pages/UserManagement';

export function Users() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <UserApprovals />;
  }

  return <UserManagement />;
}
