
import { useState, useEffect, useMemo } from 'react';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import UserAvatar from '@/modules/application/components/DesignSystem/ui/user-avatar';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { UserService } from '@/models/users/services/UserService';
import { fetchUserEmails } from '@/modules/admin/actions/fetchUserEmails';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { ArrowLeft, RotateCcw, Loader2, Trash2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface DeletedUsersContentProps {
  initialUsers: UserInterface[];
}

const DeletedUsersContent = ({ initialUsers }: DeletedUsersContentProps) => {
  const [users, setUsers] = useState<UserInterface[]>(initialUsers);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const userService = useMemo(() => new UserService(createSupabaseClient()), []);

  useEffect(() => {
    if (users.length === 0) { setEmailMap({}); return; }
    fetchUserEmails(users.map(u => u.id)).then(setEmailMap).catch(console.error);
  }, [users]);

  const handleRestore = async (userId: string, name: string) => {
    setRestoringId(userId);
    try {
      await userService.restoreUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`${name} has been restored`);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setRestoringId(null);
    }
  };

  const usersWithEmail = users.map(u => ({ ...u, email: emailMap[u.id] ?? u.email }));

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deleted Users</h1>
          <p className="text-gray-600">Users removed from active lists — restore to make them active again</p>
        </div>
      </div>

      {usersWithEmail.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Trash2 size={40} className="text-gray-300" />
            <p className="font-medium text-gray-700">No deleted users</p>
            <p className="text-sm text-gray-500">Users that have been deleted will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Deleted Users ({usersWithEmail.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usersWithEmail.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      firstName={user.first_name}
                      lastName={user.last_name}
                      profileIconUrl={user.profile_icon_url}
                      size="md"
                    />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {user.first_name} {user.last_name}
                        {user.role === 'super_admin' && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>
                        )}
                        {user.role === 'school_admin' && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">School Admin</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{user.username}
                        {user.school && <span> • {user.school.name}</span>}
                        {user.email && <span> • {user.email}</span>}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(user.id, `${user.first_name} ${user.last_name}`)}
                    disabled={restoringId === user.id}
                    className="text-green-700 border-green-300 hover:bg-green-50"
                  >
                    {restoringId === user.id ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : (
                      <RotateCcw size={14} className="mr-2" />
                    )}
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeletedUsersContent;
