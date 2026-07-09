import { useState, useMemo } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Input } from "@/modules/application/components/DesignSystem/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/application/components/DesignSystem/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/application/components/DesignSystem/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/modules/application/components/DesignSystem/ui/alert-dialog";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { SchoolService } from "@/models/schools/services/SchoolService";
import useAdminData from "@/modules/common/hooks/useAdminData";
import SchoolCreateEditDialog from "./SchoolCreateEditDialog";
import {
  School,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { m } from "framer-motion";
interface SchoolManagementContentProps {
  user: UserInterface;
  initialSchools: SchoolInterface[];
}

const SchoolManagementContent = ({ user, initialSchools }: SchoolManagementContentProps) => {
  const schoolService = useMemo(() => new SchoolService(createSupabaseClient()), []);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolInterface | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<SchoolInterface | null>(null);
  const router = useRouter();
  const navigate = useNavigate();

  const {
    data: schools,
    filteredData: filteredSchools,
    loading,
    searchTerm,
    setSearchTerm,
    refresh: refreshSchools,
  } = useAdminData({
    fetchFn: () => schoolService.getAllWithStats(true),
    filterFn: (school, term) =>
      school.name.toLowerCase().includes(term.toLowerCase()) ||
      school.code.toLowerCase().includes(term.toLowerCase()),
    initialData: initialSchools,
    fetchOnMount: false,
  });

  // Handle school deletion
  const handleDeleteSchool = async () => {
    if (!deletingSchool) return;

    try {
      await schoolService.delete(deletingSchool.id);
      toast.success(`School "${deletingSchool.name}" deleted successfully`);
      setDeletingSchool(null);
      await refreshSchools();
    } catch (error: any) {
      if (error.message?.includes("existing students")) {
        toast.error("Cannot delete school with existing students");
      } else {
        notifyAboutError(error);
      }
    }
  };

  // Handle toggling school active status
  const handleToggleActive = async (school: SchoolInterface) => {
    try {
      await schoolService.update(school.id, {
        is_active: !school.is_active,
      });
      toast.success(`School ${!school.is_active ? "activated" : "deactivated"} successfully`);
      await refreshSchools();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  // Calculate statistics
  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => s.is_active).length;
  const totalStudents = schools.reduce((sum, s) => sum + s.total_students, 0);
  const totalPoints = schools.reduce((sum, s) => sum + s.total_points, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
            School Management
          </h1>
          <p className="text-gray-600">Manage all schools in the platform</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus size={18} />
          Add School
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Schools", value: totalSchools, sub: `${activeSchools} active`, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Students", value: totalStudents.toLocaleString(), sub: "Across all schools", icon: Users, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Points", value: totalPoints.toLocaleString(), sub: "Platform-wide", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Avg Students", value: totalSchools > 0 ? Math.round(totalStudents / totalSchools) : 0, sub: "Per school", icon: BarChart3, color: "text-pink-600", bg: "bg-pink-50" },
        ].map((stat, i) => (
          <m.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </m.div>
        ))}
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search schools by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredSchools.length} {filteredSchools.length === 1 ? "school" : "schools"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Registration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading schools...
                    </TableCell>
                  </TableRow>
                ) : filteredSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No schools found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-muted-foreground" />
                          {school.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{school.code}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {school.total_students.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {school.total_points.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {school.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {school.is_internal ? (
                          <Badge className="bg-purple-100 text-purple-800">Internal</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">Public</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {school.registration_method === "allowlist" ? (
                          <Badge className="bg-amber-100 text-amber-800">Allow List</Badge>
                        ) : (
                          <Badge className="bg-cyan-100 text-cyan-800">Email Domain</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => navigate({ to: `/admin?schoolId=${school.id}` })}
                              className="cursor-pointer"
                            >
                              <LayoutDashboard className="h-4 w-4 mr-2" />
                              Manage School
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditingSchool(school)}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit School
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(school)}
                              className="cursor-pointer"
                            >
                              {school.is_active ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingSchool(school)}
                              className="cursor-pointer text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete School
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <SchoolCreateEditDialog
        isOpen={isCreateDialogOpen || !!editingSchool}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingSchool(null);
        }}
        onSuccess={async () => {
          setIsCreateDialogOpen(false);
          setEditingSchool(null);
          await refreshSchools();
        }}
        school={editingSchool}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSchool} onOpenChange={() => setDeletingSchool(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete School
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSchool?.name}"? This action cannot be
              undone. The school must have no students to be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchool} className="bg-red-600 hover:bg-red-700">
              Delete School
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchoolManagementContent;
