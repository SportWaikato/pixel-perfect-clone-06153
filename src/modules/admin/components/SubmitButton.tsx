
import { Loader2 } from 'lucide-react';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';

interface SubmitButtonProps {
  isSubmitting: boolean;
  loadingText: string;
  children: React.ReactNode;
  className?: string;
}

const SubmitButton = ({ isSubmitting, loadingText, children, className }: SubmitButtonProps) => (
  <Button
    type="submit"
    disabled={isSubmitting}
    className={className}
    style={{ backgroundColor: '#0B4B39' }}
  >
    {isSubmitting ? (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingText}
      </span>
    ) : (
      children
    )}
  </Button>
);

export default SubmitButton;
