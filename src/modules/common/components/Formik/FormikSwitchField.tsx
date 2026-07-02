import { Field, useField } from "formik";
import { Switch } from "@/modules/application/components/DesignSystem/ui/switch";
import { Label } from "@/modules/application/components/DesignSystem/ui/label";
import { cn } from "@/modules/common/utils";

interface FormikSwitchFieldProps {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

const FormikSwitchField = ({
  name,
  label,
  description,
  disabled = false,
  className,
}: FormikSwitchFieldProps) => {
  const [field, meta, helpers] = useField(name);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Switch
          id={name}
          checked={field.value}
          onCheckedChange={(checked) => helpers.setValue(checked)}
          disabled={disabled}
          className={cn(field.value ? "bg-blue-600" : "bg-gray-200")}
        />
        <Label
          htmlFor={name}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            disabled && "opacity-70",
          )}
        >
          {label}
        </Label>
      </div>
      {description && <p className="text-sm text-gray-600">{description}</p>}
      {meta.touched && meta.error && <div className="text-red-500 text-sm">{meta.error}</div>}
    </div>
  );
};

export default FormikSwitchField;
