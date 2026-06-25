import { STEP_LABELS, TOTAL_STEPS } from './types';

interface StepProgressProps {
  currentStep: number;
}

const StepProgress = ({ currentStep }: StepProgressProps) => {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold tracking-widest text-[#0B4B39] mb-3">
        STEP {currentStep} OF {TOTAL_STEPS} — {STEP_LABELS[currentStep]}
      </p>
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i < currentStep ? '#0B4B39' : '#D1D5DB' }}
          />
        ))}
      </div>
    </div>
  );
};

export default StepProgress;
