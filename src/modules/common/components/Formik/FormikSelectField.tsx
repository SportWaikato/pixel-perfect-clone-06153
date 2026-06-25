import { Field, ErrorMessage } from 'formik';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';
import { Label } from '@/modules/application/components/DesignSystem/ui/label';
import { cn } from '@/modules/common/utils';

interface FormikSelectFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  children: React.ReactNode;
  onValueChange?: (value: string, helpers: { form: any; field: any }) => void;
}

const FormikSelectField = ({ name, label, placeholder, children, onValueChange }: FormikSelectFieldProps) => {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={name}>{label}</Label>}
      <Field name={name}>
        {({ field, form, meta }: any) => (
          <>
            <Select
              value={field.value}
              onValueChange={(value) => {
                form.setFieldValue(name, value);
                onValueChange?.(value, { form, field });
              }}
            >
              <SelectTrigger 
                className={cn(
                  'w-full',
                  meta.touched && meta.error ? 'border-red-500' : ''
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {children}
              </SelectContent>
            </Select>
            <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
          </>
        )}
      </Field>
    </div>
  );
};

export default FormikSelectField; 