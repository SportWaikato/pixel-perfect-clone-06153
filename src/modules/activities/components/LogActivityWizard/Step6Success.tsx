import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Flame, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface Step6SuccessProps {
  user: UserInterface;
  pointsEarned: number;
  onLogAnother: () => void;
}

const Step6Success = ({ user, pointsEarned, onLogAnother }: Step6SuccessProps) => {
  const firstName = user.first_name || 'there';
  const currentStreak = user.current_streak || 0;

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      {/* Trophy graphic */}
      <div className="text-6xl select-none">🏆</div>

      <div>
        <h2 className="text-2xl font-black text-[#0B4B39]">Activity logged!</h2>
        <p className="text-lg font-bold text-gray-700 mt-1">Ka pai, {firstName}!</p>
      </div>

      {/* Points */}
      <div className="w-full p-5 bg-[#0B4B39]/5 border border-[#0B4B39]/15 rounded-2xl space-y-3">
        <div className="text-5xl font-black" style={{ color: '#19AA4B' }}>
          +{pointsEarned}
        </div>
        <p className="text-gray-500 text-sm">points earned</p>

        {currentStreak > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-orange-600">
            <Flame size={16} />
            Day {currentStreak} streak — keep it up!
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="w-full space-y-3">
        <Button
          onClick={onLogAnother}
          className="w-full gap-2 py-3 rounded-2xl font-bold"
          style={{ backgroundColor: '#0B4B39', color: 'white' }}
        >
          <Plus size={16} />
          Log another activity
        </Button>
        <Button
          variant="outline"
          className="w-full py-3 rounded-2xl font-medium border-2"
          asChild
        >
          <Link href="/activities">View your activity log</Link>
        </Button>
      </div>
    </div>
  );
};

export default Step6Success;
