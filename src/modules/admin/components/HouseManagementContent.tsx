import { useState, useEffect, useMemo } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { HouseInterface } from "@/models/houses/interfaces/HouseInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/application/components/DesignSystem/ui/select";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Input } from "@/modules/application/components/DesignSystem/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/modules/application/components/DesignSystem/ui/dialog";
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
} from "@/modules/application/components/DesignSystem/ui/alert-dialog";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { HouseService } from "@/models/houses/services/HouseService";
import { isSuperAdmin as checkIsSuperAdmin } from "@/modules/auth/utils/roleUtils";
import useAdminData from "@/modules/common/hooks/useAdminData";
import { ArrowLeft, Plus, Search, Edit, Trash2, Crown, Users, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { Link } from "@tanstack/react-router";
import { Formik, Form } from "formik";
import { object, string } from "yup";
import { FormikInputField } from "@/modules/common/components/Formik";

interface HouseManagementContentProps {
  user: UserInterface;
  backHref?: string;
  schoolId?: string;
  schoolName?: string;
  schools?: SchoolInterface[];
}

interface HouseFormData {
  name: string;
  color: string;
}

const validationSchema = object().shape({
  name: string()
    .trim()
    .min(2, "House name must be at least 2 characters")
    .max(50, "House name must be at most 50 characters")
    .required("House name is required"),
  color: string()
    .matches(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color code (e.g., #FF6B6B)")
    .required("House color is required"),
});

const predefinedColors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFB74D",
  "#9575CD",
  "#42A5F5",
  "#66BB6A",
  "#FF8A65",
  "#BA68C8",
  "#26A69A",
  "#8BC34A",
  "#FFA726",
  "#7986CB",
  "#EF5350",
  "#29B6F6",
];

const HouseManagementContent = ({
  user,
  backHref,
  schoolId,
  schoolName,
  schools = [],
}: HouseManagementContentProps) => {
  const isSuperAdmin = checkIsSuperAdmin(user);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>(
    isSuperAdmin ? schoolId : schoolId || user.school_id,
  );
  const [selectedSchoolName, setSelectedSchoolName] = useState<string | undefined>(
    isSuperAdmin ? schoolName : schoolName || user.school?.name,
  );

  const effectiveSchoolId = selectedSchoolId;
  const effectiveSchoolName = selectedSchoolName;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseInterface | null>(null);

  const handleSchoolChange = (value: string) => {
    const school = schools.find((s) => s.id === value);
    setSelectedSchoolId(value);
    setSelectedSchoolName(school?.name);
  };

  const houseService = useMemo(() => new HouseService(createSupabaseClient()), []);

  const {
    data: houses,
    filteredData: filteredHouses,
    loading,
    searchTerm,
    setSearchTerm,
    refresh: fetchHouses,
    setData: setHouses,
  } = useAdminData({
    fetchFn: () => houseService.getBySchoolId(effectiveSchoolId!),
    filterFn: (house, term) => house.name.toLowerCase().includes(term.toLowerCase()),
    fetchOnMount: false,
  });

  useEffect(() => {
    if (effectiveSchoolId) {
      fetchHouses();
    } else {
      setHouses([]);
    }
  }, [effectiveSchoolId, fetchHouses, setHouses]);

  const handleCreateHouse = async (values: HouseFormData, { setSubmitting }: any) => {
    try {
      // Check if name already exists
      const nameExists = await houseService.checkNameExists(values.name.trim(), effectiveSchoolId!);
      if (nameExists) {
        toast.error("A house with this name already exists in your school");
        setSubmitting(false);
        return;
      }

      await houseService.create({
        name: values.name.trim(),
        color: values.color,
        school_id: effectiveSchoolId!,
      });

      toast.success("House created successfully!");
      setShowCreateDialog(false);
      fetchHouses();
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateHouse = async (values: HouseFormData, { setSubmitting }: any) => {
    if (!editingHouse) return;

    try {
      // Check if name already exists (excluding current house)
      const nameExists = await houseService.checkNameExists(
        values.name.trim(),
        effectiveSchoolId!,
        editingHouse.id,
      );
      if (nameExists) {
        toast.error("A house with this name already exists in your school");
        setSubmitting(false);
        return;
      }

      await houseService.update(editingHouse.id, {
        name: values.name.trim(),
        color: values.color,
      });

      toast.success("House updated successfully!");
      setEditingHouse(null);
      fetchHouses();
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHouse = async (houseId: string) => {
    try {
      await houseService.delete(houseId);
      toast.success("House deleted successfully!");
      fetchHouses();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const HouseForm = ({
    initialValues,
    onSubmit,
    submitText,
  }: {
    initialValues: HouseFormData;
    onSubmit: (values: HouseFormData, formikBag: any) => Promise<void>;
    submitText: string;
  }) => (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className="space-y-4">
          <FormikInputField name="name" label="House Name" placeholder="Enter house name" />

          <div className="space-y-2">
            <label className="text-sm font-medium">House Color</label>
            <FormikInputField name="color" label="" placeholder="#FF6B6B" type="text" />

            {/* Color Preview */}
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: values.color }}
              />
              <span className="text-sm text-gray-600">Color preview</span>
            </div>

            {/* Predefined Colors */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Quick select:</p>
              <div className="grid grid-cols-8 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                      values.color === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFieldValue("color", color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingHouse(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: "#1B5E4B" }}>
              {isSubmitting ? "Saving..." : submitText}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ACEF]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backHref || "/admin"}>
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">House Management</h1>
            <p className="text-gray-600">
              {effectiveSchoolName
                ? `Manage house teams for ${effectiveSchoolName}`
                : "Select a school to manage houses"}
            </p>
          </div>
        </div>

        {effectiveSchoolId && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" style={{ backgroundColor: "#1B5E4B" }}>
                <Plus size={16} />
                Add House
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New House</DialogTitle>
                <DialogDescription>
                  Add a new house team to your school. Each house should have a unique name and
                  color.
                </DialogDescription>
              </DialogHeader>
              <HouseForm
                initialValues={{ name: "", color: predefinedColors[0] }}
                onSubmit={handleCreateHouse}
                submitText="Create House"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {isSuperAdmin && schools.length > 0 && (
              <Select value={selectedSchoolId ?? ""} onValueChange={handleSchoolChange}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder="Search houses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Houses</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{houses.length}</div>
            <p className="text-xs text-muted-foreground">Active house teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing House</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {houses.length > 0 ? houses[0]?.name || "None" : "None"}
            </div>
            <p className="text-xs text-muted-foreground">
              {houses.length > 0 ? `${houses[0]?.total_points || 0} points` : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {houses.reduce((sum, house) => sum + house.total_points, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Combined house total</p>
          </CardContent>
        </Card>
      </div>

      {/* Houses List */}
      <Card>
        <CardHeader>
          <CardTitle>Houses ({filteredHouses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHouses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "No houses found matching your search."
                : "No houses created yet. Create your first house to get started!"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHouses.map((house) => (
                <div
                  key={house.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center"
                      style={{ backgroundColor: house.color }}
                    >
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">{house.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span>Color: {house.color}</span>
                        <span>•</span>
                        <span>{house.total_points} points</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{house.total_points} pts</Badge>

                    <Dialog
                      open={editingHouse?.id === house.id}
                      onOpenChange={(open) => {
                        if (!open) setEditingHouse(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingHouse(house)}>
                          <Edit size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit House</DialogTitle>
                          <DialogDescription>
                            Update the house name and color. Changes will be reflected immediately.
                          </DialogDescription>
                        </DialogHeader>
                        <HouseForm
                          initialValues={{
                            name: editingHouse?.name || "",
                            color: editingHouse?.color || predefinedColors[0],
                          }}
                          onSubmit={handleUpdateHouse}
                          submitText="Update House"
                        />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete House</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{house.name}"? This action cannot be
                            undone. Students currently assigned to this house will need to be
                            reassigned to another house.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteHouse(house.id)}
                          >
                            Delete House
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HouseManagementContent;
