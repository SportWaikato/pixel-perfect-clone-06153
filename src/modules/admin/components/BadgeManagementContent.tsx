// TODO: Restore from Next.js source — automated codemod mangled JSX during port.
// Original at git history pre-TanStack port. Renders a stub for now so routing wires up.
import { UserInterface } from '@/models/users/interfaces/UserInterface';

interface BadgeManagementContentProps {
  user: UserInterface;
}

const BadgeManagementContent = ({ user: _user }: BadgeManagementContentProps) => {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-2">Badge Management</h1>
      <p className="text-muted-foreground">This screen needs to be rebuilt — automated migration mangled the JSX.</p>
    </div>
  );
};

export default BadgeManagementContent;
