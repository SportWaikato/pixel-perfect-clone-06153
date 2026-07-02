import { Field, ErrorMessage } from "formik";
import { Input } from "@/modules/application/components/DesignSystem/ui/input";
import { Label } from "@/modules/application/components/DesignSystem/ui/label";

interface FormikInputFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  step?: string;
  defaultValue?: string;
  disabled?: boolean;
}

const FormikInputField = ({ name, label, disabled, ...props }: FormikInputFieldProps) => {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={name}>{label}</Label>}
      <Field name={name}>
        {({ field, meta }: any) => (
          <>
            <Input
              {...field}
              {...props}
              value={field.value ?? ""}
              id={name}
              disabled={disabled}
              className={meta.touched && meta.error ? "border-red-500" : ""}
            />
            <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
          </>
        )}
      </Field>
    </div>
  );
};

export default FormikInputField;
