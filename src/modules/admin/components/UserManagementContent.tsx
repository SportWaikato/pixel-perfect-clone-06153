import { useState, useEffect, useMemo, useRef } from 'react';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Input } from '@/modules/application/components/DesignSystem/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';
import UserAvatar from '@/modules/application/components/DesignSystem/ui/user-avatar';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { UserService } from '@/models/users/services/UserService';
import { isSuperAdmin as checkIsSuperAdmin, isAdmin } from '@/modules/auth/utils/roleUtils';
import useAdminData from '@/modules/common/hooks/useAdminData';
import { Search, MoreHorizontal, UserCheck, UserX, ArrowLeft, ShieldCheck, Loader2, Building2, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Pencil } from 'lucide-react';
import { HouseService } from '@/models/houses/services/HouseService';
import { HouseInterface } from '@/models/houses/interfaces/HouseInterface';
import { YEAR_GROUPS } from '@/models/application/constants/applicationConstants';
import { SuperAdminInviteInterface } from '@/models/invites/interfaces/SuperAdminInviteInterface';
import SuperAdminInviteSection from './SuperAdminInviteSection';
import { fetchUserEmails } from '@/modules/admin/actions/fetchUserEmails';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { Link } from '@tanstack/react-router';
import { useRouter } from '@tanstack/react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/modules/application/components/DesignSystem/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/modules/application/components/DesignSystem/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/modules/application/components/DesignSystem/ui/alert-dialog';

interface UserManagementContentProps {
  user: UserInterface;
  backHref?: string;
  schoolId?: string;
  schools?: SchoolInterface[];
  initialInvites?: SuperAdminInviteInterface[];
}

const UserManagementContent = ({ user: currentUser, backHref, schoolId, schools = [], initialInvites = [] }: UserManagementContentProps) => {
  const router = useRouter();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [houseFilter, setHouseFilter] = useState('all');
  const [yearGroupFilter, setYearGroupFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    schoolId || (isSuperAdmin ? 'all' : currentUser.school_id || '')
  );
  const [promoteUser, setPromoteUser] = useState<{ user: UserInterface; targetRole: UserInterface['role'] } | null>(null);
  const [editUser, setEditUser] = useState<UserInterface | null>(null);
  const [editForm, setEditForm] = useState<{
    first_name: string;
    last_name: string;
    username: string;
    social_handle: string;
    year_group: string;
    class: string;
    school_id: string;
    house_id: string;
    monthly_goal_minutes: number;
    is_public: boolean;
  }>({ first_name: '', last_name: '', username: '', social_handle: '', year_group: '', class: '', school_id: '', house_id: '', monthly_goal_minutes: 0, is_public: false });
  const [housesForEdit, setHousesForEdit] = useState<HouseInterface[]>([]);
  const [housesForFilter, setHousesForFilter] = useState<HouseInterface[]>([]);
  const [userToDelete, setUserToDelete] = useState<UserInterface | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'first_name' | 'last_name'>('first_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const allSchoolsDataLoadedRef = useRef(false);

  const userService = useMemo(() => new UserService(createSupabaseClient()), []);
  const houseService = useMemo(() => new HouseService(createSupabaseClient()), []);

  const { data: users, loading, searchTerm, setSearchTerm, refresh, setData: setUsers } = useAdminData({
    fetchFn: () => {
      const options: { school_id?: string; limit: number } = { limit: 2000 };
      if (selectedSchoolId && selectedSchoolId !== 'all') {
        options.school_id = selectedSchoolId;
      }
      return userService.getUsersWithRankings(options);
    },
    fetchOnMount: false,
  });

  useEffect(() => {
    if (isSuperAdmin && selectedSchoolId === 'all') {
      allSchoolsDataLoadedRef.current = false;
      setUsers([]);
      return;
    }
    if (isSuperAdmin || selectedSchoolId) {
      refresh();
    }
  }, [selectedSchoolId, refresh]);

  useEffect(() => {
    if (!isSuperAdmin || selectedSchoolId !== 'all') return;
    if (searchTerm) {
      if (!allSchoolsDataLoadedRef.current) {
        allSchoolsDataLoadedRef.current = true;
        refresh();
      }
    } else {
      allSchoolsDataLoadedRef.current = false;
      setUsers([]);
    }
  }, [searchTerm, selectedSchoolId, isSuperAdmin, refresh]);

  useEffect(() => {
    if (selectedSchoolId && selectedSchoolId !== 'all') {
      houseService.getBySchoolId(selectedSchoolId).then(setHousesForFilter);
    } else {
      setHousesForFilter([]);
      setHouseFilter('all');
    }
  }, [selectedSchoolId, houseService]);

  useEffect(() => {
    if (users.length === 0) { setEmailMap({}); return; }
    fetchUserEmails(users.map(u => u.id)).then(setEmailMap).catch(console.error);
  }, [users]);

  const filteredUsers = useMemo(() => {
    let filtered = users.map(u => ({ ...u, email: emailMap[u.id] ?? u.email }));
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.first_name.toLowerCase().includes(term) ||
        user.last_name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        (user.email && user.email.toLowerCase().includes(term))
      );
    }
    if (houseFilter !== 'all') {
      filtered = filtered.filter(user => user.house_id === houseFilter);
    }
    if (yearGroupFilter !== 'all') {
      filtered = filtered.filter(user => user.year_group === yearGroupFilter);
    }
    if (classFilter) {
      const classTerm = classFilter.toLowerCase();
      filtered = filtered.filter(user => user.class?.toLowerCase().includes(classTerm));
    }
    filtered.sort((a, b) => {
      const aVal = (a[sortField] || '').toLowerCase();
      const bVal = (b[sortField] || '').toLowerCase();
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return filtered;
  }, [users, emailMap, searchTerm, houseFilter, yearGroupFilter, classFilter, sortField, sortDirection]);

  const handleSchoolChange = (value: string) => {
    setSelectedSchoolId(value);
    setHouseFilter('all');
    setYearGroupFilter('all');
    setClassFilter('');
    setSearchTerm('');
    if (value === 'all') {
      router.replace('/admin/users');
    } else {
      router.replace(`/admin/users?schoolId=${value}`);
    }
  };

  const handleToggleActiveStatus = async (userId: string, isCurrentlyActive: boolean) => {
    try {
      await userService.update(userId, { is_active: !isCurrentlyActive });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: !isCurrentlyActive } : user
      ));
      
      toast.success(`User ${!isCurrentlyActive ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const openPromoteDialog = (user: UserInterface, targetRole: UserInterface['role']) => {
    setPromoteUser({ user, targetRole });
  };

  const handlePromote = async () => {
    if (!promoteUser) return;
    const { user: target, targetRole } = promoteUser;
    try {
      const updates: Partial<UserInterface> = { role: targetRole };
      if (targetRole === 'school_admin') {
        updates.year_group = 'Staff';
      }
      await userService.update(target.id, updates);
      setUsers(prev => prev.map(u =>
        u.id === target.id ? { ...u, ...updates } : u
      ));
      const roleLabel = targetRole === 'super_admin' ? 'Super Admin' : 'School Admin';
      toast.success(`${target.first_name} ${target.last_name} promoted to ${roleLabel}`);
      setPromoteUser(null);
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const canEditUser = (targetUser: UserInterface): boolean => {
    if (targetUser.id === currentUser.id) return false;
    if (currentUser.role === 'super_admin') return targetUser.role !== 'super_admin';
    if (currentUser.role === 'school_admin') return targetUser.role === 'student';
    return false;
  };

  const openEditDialog = async (targetUser: UserInterface) => {
    setEditUser(targetUser);
    setEditForm({
      first_name: targetUser.first_name,
      last_name: targetUser.last_name,
      username: targetUser.username,
      social_handle: targetUser.social_handle || '',
      year_group: targetUser.year_group || '',
      class: targetUser.class || '',
      school_id: targetUser.school_id,
      house_id: targetUser.house_id || '',
      monthly_goal_minutes: targetUser.monthly_goal_minutes,
      is_public: targetUser.is_public,
    });
    if (targetUser.school_id) {
      const houses = await houseService.getBySchoolId(targetUser.school_id);
      setHousesForEdit(houses);
    }
  };

  const handleEditSchoolChange = async (schoolId: string) => {
    setEditForm(prev => ({ ...prev, school_id: schoolId, house_id: '' }));
    const houses = await houseService.getBySchoolId(schoolId);
    setHousesForEdit(houses);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    try {
      const updates: Partial<UserInterface> = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        username: editForm.username.trim(),
        social_handle: editForm.social_handle.trim() || undefined,
        year_group: editForm.year_group || undefined,
        class: editForm.class.trim() || undefined,
        school_id: editForm.school_id,
        house_id: editForm.house_id || null,
        monthly_goal_minutes: editForm.monthly_goal_minutes,
        is_public: editForm.is_public,
      };
      await userService.update(editUser.id, updates);
      toast.success(`${editForm.first_name} ${editForm.last_name} updated successfully`);
      setEditUser(null);
      refresh();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const canToggleActiveStatus = (targetUser: UserInterface) => {
    if (currentUser.role !== 'school_admin') return true;
    return targetUser.id !== currentUser.id &&
      targetUser.role !== 'school_admin' &&
      targetUser.role !== 'super_admin';
  };

  const canDeleteUser = (targetUser: UserInterface) => {
    if (targetUser.id === currentUser.id) return false;
    if (currentUser.role === 'super_admin') return true;
    return currentUser.role === 'school_admin' && targetUser.role === 'student';
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const getUniqueHouses = () => {
    const houses = users
      .filter(user => user.house)
      .map(user => user.house!)
      .filter((house, index, array) => 
        array.findIndex(h => h.id === house.id) === index
      );
    return houses;
  };

  const selectedSchoolName = selectedSchoolId === 'all'
    ? 'All Schools'
    : schools.find(s => s.id === selectedSchoolId)?.name || currentUser.school?.name;

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref || '/admin/dashboard'}>
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">{selectedSchoolName}</p>
          </div>
        </div>
        {isAdmin(currentUser) && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/deleted-users" className="flex items-center gap-2">
              <Trash2 size={16} />
              Deleted Users
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {isSuperAdmin && schools.length > 0 && (
              <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Schools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={houseFilter}
              onValueChange={setHouseFilter}
              disabled={selectedSchoolId === 'all'}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={selectedSchoolId === 'all' ? 'Select school first' : 'All Houses'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Houses</SelectItem>
                {housesForFilter.map(house => (
                  <SelectItem key={house.id} value={house.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: house.color }}
                      />
                      {house.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearGroupFilter} onValueChange={setYearGroupFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Year Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Year Groups</SelectItem>
                {YEAR_GROUPS.map(year => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Input
                placeholder="Filter by class..."
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-40"
              />
            </div>
            {(searchTerm || houseFilter !== 'all' || yearGroupFilter !== 'all' || classFilter) && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchTerm('');
                setHouseFilter('all');
                setYearGroupFilter('all');
                setClassFilter('');
              }}>
                Clear
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Sort by:</span>
            {(['first_name', 'last_name'] as const).map(field => {
              const active = sortField === field;
              const Icon = active ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
              return (
                <Button
                  key={field}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 gap-1"
                  onClick={() => {
                    if (sortField === field) {
                      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField(field);
                      setSortDirection('asc');
                    }
                  }}
                >
                  <Icon size={12} />
                  {field === 'first_name' ? 'First name' : 'Surname'}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Promote User Dialog */}
      <Dialog open={!!promoteUser} onOpenChange={(open) => !open && setPromoteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote User</DialogTitle>
          </DialogHeader>
          {promoteUser && (
            <div className="space-y-2 py-2">
              <p className="text-sm text-gray-600">
                Promote <span className="font-medium">{promoteUser.user.first_name} {promoteUser.user.last_name}</span> to{' '}
                <span className="font-medium">
                  {promoteUser.targetRole === 'super_admin' ? 'Super Admin' : 'School Admin'}
                </span>?
              </p>
              <p className="text-sm text-gray-500">
                This will give them {promoteUser.targetRole === 'super_admin' ? 'full platform' : 'school-level'} admin access.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteUser(null)}>Cancel</Button>
            <Button onClick={handlePromote}>Promote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {editUser?.first_name} {editUser?.last_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">First Name</p>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Last Name</p>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Username</p>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Username"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Social Handle</p>
                <Input
                  value={editForm.social_handle}
                  onChange={(e) => setEditForm(prev => ({ ...prev, social_handle: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Year Group</p>
                <Select value={editForm.year_group || 'none'} onValueChange={(v) => setEditForm(prev => ({ ...prev, year_group: v === 'none' ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No year group</SelectItem>
                    {YEAR_GROUPS.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Monthly Goal (min)</p>
                <Input
                  type="number"
                  min={0}
                  step={30}
                  value={editForm.monthly_goal_minutes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, monthly_goal_minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Class</p>
              <Input
                value={editForm.class}
                onChange={(e) => setEditForm(prev => ({ ...prev, class: e.target.value }))}
                placeholder="e.g. 10B (optional)"
              />
            </div>
            {isSuperAdmin ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">School</p>
                <Select value={editForm.school_id} onValueChange={handleEditSchoolChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map(school => (
                      <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">School</p>
                <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-md border">{editUser?.school?.name || 'Unknown'}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">House</p>
              <Select value={editForm.house_id || 'none'} onValueChange={(v) => setEditForm(prev => ({ ...prev, house_id: v === 'none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No house</SelectItem>
                  {housesForEdit.map(house => (
                    <SelectItem key={house.id} value={house.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: house.color }} />
                        {house.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Public Profile</p>
              <Select value={editForm.is_public ? 'true' : 'false'} onValueChange={(v) => setEditForm(prev => ({ ...prev, is_public: v === 'true' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Public</SelectItem>
                  <SelectItem value="false">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={!editForm.first_name.trim() || !editForm.last_name.trim() || !editForm.username.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium">{userToDelete?.first_name} {userToDelete?.last_name}</span>?
              They will be hidden from all lists. A Super Admin can restore them from the Deleted Users page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (userToDelete) handleDeleteUser(userToDelete.id);
                setUserToDelete(null);
              }}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Users Table */}
      {isSuperAdmin && selectedSchoolId === 'all' && !searchTerm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Building2 size={40} className="text-gray-300" />
            <p className="font-medium text-gray-700">Search to find users across all schools</p>
            <p className="text-sm text-gray-500">Enter a name or username above, or select a specific school.</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#00ACEF]" />
            <span className="text-gray-500">Loading users...</span>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            No users found matching your criteria.
          </CardContent>
        </Card>
      ) : (
        <>
          {(['student', 'school_admin', 'super_admin'] as UserInterface['role'][]).map((role) => {
            const group = filteredUsers.filter(u => u.role === role);
            if (group.length === 0) return null;
            const label = role === 'student' ? 'Students' : role === 'school_admin' ? 'School Admins' : 'Super Admins';
            const PAGE_SIZE = 25;
            const isExpanded = expandedRoles.has(role);
            const visibleGroup = role === 'student' && !isExpanded ? group.slice(0, PAGE_SIZE) : group;
            const hasMore = role === 'student' && group.length > PAGE_SIZE;
            return (
              <Card key={role}>
                <CardHeader>
                  <CardTitle>{label} ({group.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {visibleGroup.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
                              {user.is_active === false && (
                                <Badge variant="destructive">Suspended</Badge>
                              )}
                              {user.role === 'super_admin' && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>
                              )}
                              {user.role === 'school_admin' && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">School Admin</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              @{user.username}
                              {user.role === 'student' && <span> • {user.year_group || 'No year group'}{user.class ? ` • ${user.class}` : ''}</span>}
                              {user.role === 'student' && isSuperAdmin && selectedSchoolId === 'all' && user.school && (
                                <span className="ml-1 text-gray-400">• {user.school.name}</span>
                              )}
                              {user.role === 'school_admin' && user.school && (
                                <span> • {user.school.name}</span>
                              )}
                              {user.email && <span className="text-gray-400"> • {user.email}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {user.role === 'student' && user.house && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: user.house.color }}
                              />
                              <span className="text-sm">{user.house.name}</span>
                            </div>
                          )}

                          <div className="text-right">
                            <div className="font-medium">{Math.round(user.total_minutes)} minutes</div>
                            <div className="text-sm text-gray-500">Total activity</div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canEditUser(user) && (
                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                  <Pencil size={16} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canToggleActiveStatus(user) && (
                                <DropdownMenuItem
                                  onClick={() => handleToggleActiveStatus(user.id, user.is_active !== false)}
                                  className={user.is_active === false ? "text-green-600" : "text-red-600"}
                                >
                                  {user.is_active === false ? (
                                    <>
                                      <UserCheck size={16} className="mr-2" />
                                      Activate User
                                    </>
                                  ) : (
                                    <>
                                      <UserX size={16} className="mr-2" />
                                      Suspend User
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {canDeleteUser(user) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setUserToDelete(user)}
                                    className="text-red-700 focus:text-red-700"
                                  >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                              {((user.role === 'student' && isAdmin(currentUser)) ||
                                (user.role === 'school_admin' && isSuperAdmin)) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel className="text-xs font-normal text-gray-400 px-2 py-1">Promote to</DropdownMenuLabel>
                                  {user.role === 'student' && isAdmin(currentUser) && (
                                    <DropdownMenuItem onClick={() => openPromoteDialog(user, 'school_admin')}>
                                      <ShieldCheck size={16} className="mr-2" />
                                      School Admin
                                    </DropdownMenuItem>
                                  )}
                                  {isSuperAdmin && (user.role === 'student' || user.role === 'school_admin') && (
                                    <DropdownMenuItem onClick={() => openPromoteDialog(user, 'super_admin')}>
                                      <ShieldCheck size={16} className="mr-2" />
                                      Super Admin
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedRoles(prev => {
                          const next = new Set(prev);
                          if (isExpanded) next.delete(role); else next.add(role);
                          return next;
                        })}
                      >
                        {isExpanded ? `Show first ${PAGE_SIZE}` : `Show all ${group.length} students`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}

      {/* Super admin invite section — only visible to super admins */}
      {isSuperAdmin && (
        <SuperAdminInviteSection initialInvites={initialInvites} />
      )}
    </div>
  );
};

export default UserManagementContent; 