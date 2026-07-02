import { User, Users } from "lucide-react";
import { FEELING_MAPPINGS } from "@/modules/activities/utils/activityIcons";
import { WizardState } from "./types";
import { cn } from "@/modules/common/utils";

interface Step4FeedbackProps {
  data: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

const Step4Feedback = ({ data, onChange }: Step4FeedbackProps) => {
  const feelings = Object.entries(FEELING_MAPPINGS).map(([value, mapping]) => ({
    value,
    emoji: mapping.emoji,
    label: mapping.label,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#0B4B39] mb-0.5">One more thing&hellip;</h2>
        <p className="text-gray-500 text-sm">Takes 10 seconds.</p>
      </div>

      {/* Mood */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">
          How did it feel? <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {feelings.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onChange({ feeling: f.value })}
              title={f.label}
              className={cn(
                "flex-1 py-2.5 rounded-xl border text-2xl transition-all duration-150 hover:scale-110",
                data.feeling === f.value
                  ? "border-[#cf04d2] bg-[#0B4B39]/5 scale-110"
                  : "border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              {f.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Participation */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Who were you with?</label>
        <div className="flex gap-3">
          {(
            [
              { value: "solo", label: "Solo", icon: User },
              { value: "with_others", label: "With others", icon: Users },
            ] as const
          ).map((opt) => {
            const IconComponent = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ participationType: opt.value })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all duration-150",
                  data.participationType === opt.value
                    ? "border-[#cf04d2] bg-[#0B4B39]/5 text-[#0B4B39]"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                )}
              >
                <IconComponent size={16} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Add any details about your activity..."
          rows={3}
          className="w-full py-3 px-4 bg-[#0B4B39]/5 text-gray-900 border border-gray-200 rounded-xl focus:border-[#cf04d2] focus:outline-none transition-colors resize-none text-sm placeholder:text-gray-400"
        />
      </div>
    </div>
  );
};

export default Step4Feedback;
