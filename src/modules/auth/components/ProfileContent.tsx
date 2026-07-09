import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import { object, string, number, boolean } from "yup";
import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { HouseInterface } from "@/models/houses/interfaces/HouseInterface";
import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import {
  SelectItem,
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/modules/application/components/DesignSystem/ui/select";
import { Label } from "@/modules/application/components/DesignSystem/ui/label";
import { FormikInputField, FormikSwitchField } from "@/modules/common/components/Formik";
import UserAvatar from "@/modules/application/components/DesignSystem/ui/user-avatar";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { UserService } from "@/models/users/services/UserService";
import { HouseService } from "@/models/houses/services/HouseService";
import { TIME_GOALS } from "@/models/application/constants/applicationConstants";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { cn } from "@/modules/common/utils";
import WearableSyncCard from "@/modules/wearables/components/WearableSyncCard";

interface ProfileContentProps {
  user: UserInterface;
  initialSchools: SchoolInterface[];
  initialHouses: HouseInterface[];
}

type ProfileValues = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  school_id: string;
  house_id: string;
  class: string;
  monthly_goal_hours: number;
  is_public: boolean;
};

const validationSchema = object().shape({
  username: string().required("Username is required"),
  first_name: string().required("First name is required"),
  last_name: string().required("Last name is required"),
  school_id: string().required("School is required"),
  house_id: string().required("House is required"),
  monthly_goal_hours: number()
    .positive("Monthly time goal must be greater than 0")
    .required("Monthly time goal is required"),
  is_public: boolean().required(),
});

const ProfileContent = ({ user, initialSchools, initialHouses }: ProfileContentProps) => {
  const [schools] = useState<SchoolInterface[]>(initialSchools);
  const [houses, setHouses] = useState<HouseInterface[]>(initialHouses);
  const [selectedSchool, setSelectedSchool] = useState<string>(user.school_id || "");
  const router = useRouter();
  const isStudent = user.role === "student";

  useEffect(() => {
    const fetchHouses = async () => {
      if (!selectedSchool) {
        setHouses([]);
        return;
      }

      try {
        const supabase = createSupabaseClient();
        const houseService = new HouseService(supabase);
        const houseList = await houseService.getBySchoolId(selectedSchool);
        setHouses(houseList);
      } catch (error) {
        notifyAboutError(error);
      }
    };

    fetchHouses();
  }, [selectedSchool]);

  const handleSubmit = async (
    values: ProfileValues,
    { setSubmitting }: FormikHelpers<ProfileValues>,
  ) => {
    try {
      const supabase = createSupabaseClient();
      const userService = new UserService(supabase);

      // Convert hours to minutes for storage
      const monthlyGoalMinutes = values.monthly_goal_hours * 60;

      const updatePayload = isStudent
        ? {
            monthly_goal_minutes: monthlyGoalMinutes,
            is_public: values.is_public,
            class: values.class || undefined,
          }
        : {
            username: values.username,
            first_name: values.first_name,
            last_name: values.last_name,
            school_id: values.school_id,
            house_id: values.house_id,
            class: values.class || undefined,
            monthly_goal_minutes: monthlyGoalMinutes,
            is_public: values.is_public,
          };

      await userService.update(user.id, updatePayload);

      toast.success("Profile updated successfully!");
      router.invalidate();
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600">Manage your personal information and activity goals</p>
        </div>

        {isStudent && (
          <div className="text-sm text-gray-500 bg-gray-50 border rounded p-3">
            Your profile details are managed by your school. Contact your administrator to update
            your name, username, school, or house. You can still update your Monthly Time Goal and
            Privacy Settings below.
          </div>
        )}

        <Card>
          <CardContent>
            <Formik
              initialValues={{
                username: user.username || "",
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                school_id: user.school_id || "",
                house_id: user.house_id || "",
                class: user.class || "",
                monthly_goal_hours: Math.round(
                  (user.monthly_goal_minutes || TIME_GOALS.MONTHLY_MINUTES) / 60,
                ),
                is_public: user.is_public ?? true,
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, values }) => (
                <Form className="space-y-6">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      firstName={values.first_name}
                      lastName={values.last_name}
                      profileIconUrl={user.profile_icon_url}
                      size="lg"
                    />
                    {/* Change button hidden until feature is implemented */}
                    {/* <Button type="button" variant="outline" size="sm">
                      Change
                    </Button> */}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormikInputField
                      name="first_name"
                      label="First Name"
                      placeholder="Alex"
                      disabled={isStudent}
                    />
                    <FormikInputField
                      name="last_name"
                      label="Last Name"
                      placeholder="Johnson"
                      disabled={isStudent}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormikInputField
                      name="username"
                      label="Username"
                      placeholder="alex.johnson"
                      disabled={isStudent}
                    />
                    <FormikInputField
                      name="email"
                      label="Email"
                      type="email"
                      placeholder="alex.johnson@school.edu"
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school_id">School</Label>
                      <Field name="school_id">
                        {({ field, form, meta }: any) => (
                          <>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                form.setFieldValue("school_id", value);
                                form.setFieldValue("house_id", ""); // Reset house when school changes
                                setSelectedSchool(value);
                              }}
                              disabled={isStudent}
                            >
                              <SelectTrigger
                                className={cn(
                                  "w-full",
                                  meta.touched && meta.error ? "border-red-500" : "",
                                )}
                              >
                                <SelectValue placeholder="Select your school" />
                              </SelectTrigger>
                              <SelectContent>
                                {schools.map((school) => (
                                  <SelectItem key={school.id} value={school.id}>
                                    {school.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <ErrorMessage
                              name="school_id"
                              component="div"
                              className="text-red-500 text-sm"
                            />
                          </>
                        )}
                      </Field>
                    </div>

                    <div className={cn("space-y-2", !selectedSchool && "opacity-50")}>
                      <Label htmlFor="house_id">House/Team</Label>
                      <Field name="house_id">
                        {({ field, form, meta }: any) => (
                          <>
                            <Select
                              value={field.value}
                              onValueChange={(value) => form.setFieldValue("house_id", value)}
                              disabled={!selectedSchool || isStudent}
                            >
                              <SelectTrigger
                                className={cn(
                                  "w-full",
                                  meta.touched && meta.error ? "border-red-500" : "",
                                  !selectedSchool && "cursor-not-allowed",
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    selectedSchool ? "Select your house" : "Select a school first"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {houses.map((house) => (
                                  <SelectItem key={house.id} value={house.id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: house.color }}
                                      ></div>
                                      {house.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <ErrorMessage
                              name="house_id"
                              component="div"
                              className="text-red-500 text-sm"
                            />
                          </>
                        )}
                      </Field>
                    </div>
                  </div>

                  <FormikInputField name="class" label="Class" placeholder="e.g. 10B" />

                  <div className="space-y-2">
                    <FormikInputField
                      name="monthly_goal_hours"
                      label="Monthly Time Goal (hours)"
                      type="number"
                      placeholder="30"
                    />
                    <div className="text-sm text-gray-600">
                      Target: {values.monthly_goal_hours || 0} hours per month
                      <span className="ml-2 text-gray-500">
                        (≈ {Math.round((values.monthly_goal_hours || 0) / 7)} hours per week)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Privacy Settings</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Control how your information appears to other users in leaderboards and
                        rankings.
                      </p>
                    </div>

                    <FormikSwitchField
                      name="is_public"
                      label="Public Profile"
                      description={
                        values.is_public
                          ? "Your name and details are visible to other users in leaderboards and rankings."
                          : "Your identity is hidden from other users, but your activities still count toward your school and house totals."
                      }
                    />

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500 mt-0.5 flex-shrink-0"></div>
                        <div className="text-sm text-blue-700">
                          <strong>Important:</strong> Your activities always count toward your
                          school's total time and house points, regardless of your privacy setting.
                          Only your individual identity is affected by this setting.
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>

        <WearableSyncCard />
      </div>
    </div>
  );
};

export default ProfileContent;
