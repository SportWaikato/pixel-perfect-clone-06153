import * as React from 'react';
import { useState, useMemo } from 'react';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { AchievementInterface } from '@/models/achievements/interfaces/AchievementInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/application/components/DesignSystem/ui/tabs';
import { Input } from '@/modules/application/components/DesignSystem/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/modules/application/components/DesignSystem/ui/alert-dialog';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { AchievementService } from '@/models/achievements/services/AchievementService';
import useAdminData from '@/modules/common/hooks/useAdminData';
import { BadgeImageHelper } from '@/models/achievements/helpers/BadgeImageHelper';
import { Plus, Search, Edit, Trash2, Award, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { Link } from '@tanstack/react-router';
const BadgeCreateEditDialog = React.lazy(() => import('./BadgeCreateEditDialog'));

interface BadgeManagementContentProps {
  user: UserInterface;
}

const BadgeManagementContent = ({ user }: BadgeManagementContentProps) => {
  const achievementService = useMemo(() => new AchievementService(createSupabaseClient()), []);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBadge, setEditingBadge] = useState<AchievementInterface | null>(null);

  const { filteredData: badges, data: allBadges, loading, searchTerm, setSearchTerm, refresh: fetchBadges } = useAdminData({
    fetchFn: () => achievementService.getAll(),
    filterFn: (badge, term) =>
      badge.name.toLowerCase().includes(term.toLowerCase()) ||
      badge.description.toLowerCase().includes(term.toLowerCase()),
  });

  const activeBadges = badges.filter(badge => badge.is_active);
  const inactiveBadges = badges.filter(badge => !badge.is_active);

  const handleCreateBadge = () => {
    setEditingBadge(null);
    setShowCreateDialog(true);
  };

  const handleEditBadge = (badge: AchievementInterface) => {
    setEditingBadge(badge);
    setShowCreateDialog(true);
  };

  const handleDeleteBadge = async (badge: AchievementInterface) => {
    try {
      await achievementService.deleteWithCleanup(badge.id);
      toast.success('Badge deleted successfully!');
      await fetchBadges();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleBadgeCreated = async () => {
    setShowCreateDialog(false);
    setEditingBadge(null);
    await fetchBadges();
  };

  const BadgeCard = ({ badge }: { badge: AchievementInterface }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{badge.name}</CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              onClick={() => handleEditBadge(badge)}
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
            >
              <Edit size={14} </React.Suspense>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                  <Trash2 size={14} </React.Suspense>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Badge</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{badge.name}"? This action cannot be undone and will affect all users who have earned this badge.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDeleteBadge(badge)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Badge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badge Image */}
        <div className="flex justify-center">
          {BadgeImageHelper.hasBadgeImage(badge) ? (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
              <img
                src={BadgeImageHelper.getBadgeImageUrl(badge)}
                alt={badge.name}
                className="absolute inset-0 w-full h-full object-cover object-contain"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
              <Award className="w-8 h-8 text-gray-400" </React.Suspense>
            </div>
          )}
        </div>

        {/* Badge Info */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600 line-clamp-2">{badge.description}</p>
          <div className="flex items-center justify-between">
            <Badge 
              variant={badge.is_active ? "default" : "secondary"}
              style={{ backgroundColor: badge.is_active ? '#19AA4B' : undefined }}
            >
              {badge.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <div className="text-sm font-medium text-green-600">
              {badge.points_reward} pts
            </div>
          </div>
          
          {/* Criteria Preview
          {badge.criteria && (
            <div className="bg-gray-50 p-2 rounded text-xs">
              <div className="text-gray-600">
                {(() => {
                  const criteria = badge.criteria;
                  switch (criteria.type) {
                    case 'specific_activity':
                      return `${criteria.duration_minutes || 0}min of ${criteria.activity_type || 'activity'}`;
                    case 'social_activity':
                      return `${criteria.duration_minutes || 0}min ${criteria.participation_type || 'with others'}`;
                    case 'time_in_nature':
                      return `${criteria.duration_minutes || 0}min in nature`;
                    case 'entry_count':
                      return `${criteria.count || 0} activities`;
                    case 'total_time':
                      return `${criteria.minutes || 0} total minutes`;
                    case 'streak':
                      return `${criteria.days || 0} day streak`;
                    default:
                      return criteria.type || 'Unknown';
                  }
                })()}
              </div>
            </div>
          )} */}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/dashboard">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Badge Management</h1>
            <p className="text-gray-600">
              Create and manage achievement badges for students
            </p>
          </div>
        </div>
        <Button 
          onClick={handleCreateBadge}
          className="gap-2"
          style={{ backgroundColor: '#0B4B39' }}
        >
          <Plus size={16} </React.Suspense>
          Create Badge
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} </React.Suspense>
          <Input
            placeholder="Search badges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          </React.Suspense>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Award size={14} </React.Suspense>
          {allBadges.length} total badges
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <CheckCircle size={16} </React.Suspense>
            Active Badges ({activeBadges.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="gap-2">
            <X size={16} </React.Suspense>
            Inactive Badges ({inactiveBadges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeBadges.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                {searchTerm ? (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" </React.Suspense>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
                    <p className="text-gray-600">
                      No active badges match your search criteria.
                    </p>
                  <</React.Suspense>
                ) : (
                  <>
                    <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" </React.Suspense>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Badges</h3>
                    <p className="text-gray-600 mb-4">
                      Get started by creating your first achievement badge.
                    </p>
                    <Button 
                      onClick={handleCreateBadge} 
                      className="gap-2"
                      style={{ backgroundColor: '#0B4B39' }}
                    >
                      <Plus size={16} </React.Suspense>
                      Create Badge
                    </Button>
                  <</React.Suspense>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {activeBadges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} </React.Suspense>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive">
          {inactiveBadges.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                {searchTerm ? (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" </React.Suspense>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
                    <p className="text-gray-600">
                      No inactive badges match your search criteria.
                    </p>
                  <</React.Suspense>
                ) : (
                  <>
                    <X className="w-12 h-12 mx-auto mb-4 text-gray-300" </React.Suspense>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Inactive Badges</h3>
                    <p className="text-gray-600">
                      All badges are currently active. Inactive badges will appear here.
                    </p>
                  <</React.Suspense>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {inactiveBadges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} </React.Suspense>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <React.Suspense fallback={<div>Loading...</div>}><BadgeCreateEditDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingBadge(null);
        }}
        onSuccess={handleBadgeCreated}
        badge={editingBadge}
      </React.Suspense>
    </div>
  );
};

export default BadgeManagementContent;
