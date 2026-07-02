import { Field, ErrorMessage } from "formik";
import { Textarea } from "@/modules/application/components/DesignSystem/ui/textarea";
import { Label } from "@/modules/application/components/DesignSystem/ui/label";

interface FormikTextareaFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  rows?: number;
}

const FormikTextareaField = ({ name, label, ...props }: FormikTextareaFieldProps) => {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={name}>{label}</Label>}
      <Field name={name}>
        {({ field, meta }: any) => (
          <>
            <Textarea
              {...field}
              {...props}
              value={field.value ?? ""}
              id={name}
              className={meta.touched && meta.error ? "border-red-500" : ""}
            />
            <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
          </>
        )}
      </Field>
    </div>
  );
};

export default FormikTextareaField;
