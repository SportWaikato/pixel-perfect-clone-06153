import { useState } from "react";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/modules/application/components/DesignSystem/ui/dialog";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Switch } from "@/modules/application/components/DesignSystem/ui/switch";
import { Label } from "@/modules/application/components/DesignSystem/ui/label";
import { Input } from "@/modules/application/components/DesignSystem/ui/input";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { Formik, Form, Field, useFormikContext } from "formik";
import { object, string } from "yup";
import { FormikInputField } from "@/modules/common/components/Formik";
import { School, Save, Loader2, Globe, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { cn } from "@/modules/common/utils";

interface SchoolCreateEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  school: SchoolInterface | null;
}

const validationSchema = object().shape({
  name: string()
    .required("School name is required")
    .min(2, "School name must be at least 2 characters")
    .max(100, "School name must be less than 100 characters"),
  code: string()
    .required("School code is required")
    .matches(/^[A-Z0-9]+$/, "School code must contain only uppercase letters and numbers")
    .min(2, "School code must be at least 2 characters")
    .max(10, "School code must be less than 10 characters"),
  registration_method: string().oneOf(["domain_blocklist", "allowlist"]).required(),
  email_domain: string()
    .nullable()
    .when("registration_method", {
      is: "domain_blocklist",
      then: (s) =>
        s
          .required("Email domain is required for domain-based registration")
          .test(
            "valid-domains",
            "Enter valid domains separated by commas (e.g. school.co.nz, other.edu)",
            (value) => {
              if (!value) return false;
              const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
              return value
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean)
                .every((d) => domainRegex.test(d));
            },
          )
          .max(255, "Domains must be less than 255 characters"),
      otherwise: (s) =>
        s
          .test(
            "valid-domains",
            "Enter valid domains separated by commas (e.g. school.co.nz)",
            (value) => {
              if (!value) return true;
              const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
              return value
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean)
                .every((d) => domainRegex.test(d));
            },
          )
          .max(255, "Domains must be less than 255 characters"),
    }),
});

type FormValues = {
  name: string;
  code: string;
  registration_method: string;
  email_domain: string;
  secondary_email_domain: string;
};

const registrationOptions = [
  {
    value: "domain_blocklist" as const,
    label: "Email Domain + Block List",
    description:
      "Students with a matching school email domain can register. Block individual addresses if needed.",
    icon: Globe,
  },
  {
    value: "allowlist" as const,
    label: "Allow List",
    description: "Only email addresses you explicitly approve can register.",
    icon: ShieldCheck,
  },
];

const RegistrationMethodField = ({ isSubmitting }: { isSubmitting: boolean }) => {
  const { values, setFieldValue, errors, touched } = useFormikContext<FormValues>();

  return (
    <div className="space-y-2">
      <Label>Registration Method</Label>
      <div className="space-y-2">
        {registrationOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = values.registration_method === option.value;
          return (
            <div key={option.value}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setFieldValue("registration_method", option.value)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-colors",
                  isSelected
                    ? "border-[#1B5E4B] bg-[#1B5E4B]/5"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                      isSelected ? "border-[#1B5E4B]" : "border-gray-300",
                    )}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-[#1B5E4B]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={isSelected ? "text-[#1B5E4B]" : "text-gray-400"} />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-[#1B5E4B]" : "text-gray-700",
                        )}
                      >
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                  </div>
                </div>
              </button>

              {/* Email domain sub-field — only shown under domain_blocklist */}
              {option.value === "domain_blocklist" && isSelected && (
                <div className="ml-7 mt-2 pl-3 border-l-2 border-[#1B5E4B]/20">
                  <Field name="email_domain">
                    {({ field, meta }: any) => (
                      <div className="space-y-1">
                        <Label htmlFor="email_domain" className="text-xs text-gray-600">
                          School Email Domain <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          {...field}
                          id="email_domain"
                          placeholder="e.g. school.co.nz, other.edu"
                          disabled={isSubmitting}
                          className={cn(
                            "h-8 text-sm",
                            meta.touched && meta.error ? "border-red-500" : "",
                          )}
                        />
                        <p className="text-xs text-gray-400">
                          Separate multiple domains with commas
                        </p>
                        {meta.touched && meta.error && (
                          <p className="text-red-500 text-xs">{meta.error}</p>
                        )}
                      </div>
                    )}
                  </Field>
                  <Field name="secondary_email_domain">
                    {({ field }: any) => (
                      <div className="space-y-1 mt-3">
                        <Label htmlFor="secondary_email_domain" className="text-xs text-gray-600">
                          Secondary Email Domain
                        </Label>
                        <Input
                          {...field}
                          id="secondary_email_domain"
                          placeholder="e.g. alumni.school.co.nz"
                          disabled={isSubmitting}
                          className="h-8 text-sm"
                        />
                        <p className="text-xs text-gray-400">
                          Optional: additional domain for staff or alumni
                        </p>
                      </div>
                    )}
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SchoolCreateEditDialog = ({
  isOpen,
  onClose,
  onSuccess,
  school,
}: SchoolCreateEditDialogProps) => {
  const [isActive, setIsActive] = useState(school?.is_active ?? true);
  const [isInternal, setIsInternal] = useState(school?.is_internal ?? false);

  const schoolService = new SchoolService(createSupabaseClient());
  const isEditing = !!school;

  const initialValues: FormValues = {
    name: school?.name || "",
    code: school?.code || "",
    registration_method: school?.registration_method || "domain_blocklist",
    email_domain: school?.email_domain || "",
    secondary_email_domain: (school as any)?.secondary_email_domain || "",
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
    try {
      const schoolData = {
        name: values.name,
        code: values.code,
        registration_method: values.registration_method as "domain_blocklist" | "allowlist",
        email_domain:
          values.registration_method === "domain_blocklist"
            ? values.email_domain
                ?.split(",")
                .map((d) => d.trim().toLowerCase())
                .filter(Boolean)
                .join(", ") || null
            : null,
        secondary_email_domain:
          values.registration_method === "domain_blocklist" && values.secondary_email_domain?.trim()
            ? values.secondary_email_domain.trim().toLowerCase() || null
            : null,
        is_active: isActive,
        is_internal: isInternal,
      };

      if (isEditing) {
        await schoolService.update(school.id, schoolData);
        toast.success("School updated successfully");
      } else {
        await schoolService.create(schoolData);
        toast.success("School created successfully");
      }

      onSuccess();
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast.error("A school with this code already exists");
      } else {
        notifyAboutError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            {isEditing ? "Edit School" : "Create New School"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the school information below"
              : "Enter the details for the new school"}
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div className="space-y-4">
                <FormikInputField
                  name="name"
                  label="School Name"
                  placeholder="Enter school name"
                  disabled={isSubmitting}
                />

                <div className="space-y-2">
                  <Label htmlFor="code">School Code</Label>
                  <Field name="code">
                    {({ field, form, meta }: any) => (
                      <>
                        <Input
                          {...field}
                          id="code"
                          placeholder="Enter school code (e.g., WHS)"
                          disabled={isSubmitting}
                          className={`uppercase ${meta.touched && meta.error ? "border-red-500" : ""}`}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            form.setFieldValue("code", e.target.value.toUpperCase());
                          }}
                        />
                        {meta.touched && meta.error && (
                          <div className="text-red-500 text-sm">{meta.error}</div>
                        )}
                      </>
                    )}
                  </Field>
                </div>

                <RegistrationMethodField isSubmitting={isSubmitting} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="is-active">Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Active schools can participate in activities
                      </p>
                    </div>
                    <Switch
                      id="is-active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="is-internal">Internal School</Label>
                      <p className="text-sm text-muted-foreground">
                        Internal schools are hidden from public leaderboards
                      </p>
                    </div>
                    <Switch
                      id="is-internal"
                      checked={isInternal}
                      onCheckedChange={setIsInternal}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isEditing ? "Update School" : "Create School"}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default SchoolCreateEditDialog;
