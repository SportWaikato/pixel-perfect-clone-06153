// TODO: Restore from Next.js source — automated codemod mangled JSX during port.
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';

interface EventApprovalContentProps {
  user: UserInterface;
  schools: SchoolInterface[];
  initialSchoolId?: string;
}

const EventApprovalContent = (_: EventApprovalContentProps) => {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-2">Event Approval</h1>
      <p className="text-muted-foreground">This screen needs to be rebuilt — automated migration mangled the JSX.</p>
    </div>
  );
};

export default EventApprovalContent;
