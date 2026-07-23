import { User, Users, Zap, Trophy } from "lucide-react";
import { WizardState } from "./types";
import { cn } from "@/modules/common/utils";

interface Step4FeedbackProps {
  data: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

const Step4Feedback = ({ data, onChange }: Step4FeedbackProps) => {
  const contexts = [
    { value: "training", label: "Training / Practice", icon: Zap, description: "Structured practice or drill" },
    { value: "casual", label: "For Fun", icon: User, description: "Casual play, just for enjoyment" },
    { value: "competition", label: "Competition", icon: Trophy, description: "Game day, tournament, or match" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1B5E4B] mb-0.5">One more thing&hellip;</h2>
        <p className="text-gray-500 text-sm font-accent">Takes 10 seconds.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">
          What kind of activity was this? <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col gap-2">
          {contexts.map((ctx) => {
            const IconComponent = ctx.icon;
            return (
              <button
                key={ctx.value}
                type="button"
                onClick={() => onChange({ activityContext: ctx.value, competitionName: ctx.value !== "competition" ? "" : data.competitionName })}
                className={cn(
                  "w-full p-3 rounded-xl border-2 transition-all duration-150 text-left",
                  data.activityContext === ctx.value
                    ? "border-[#cf04d2] bg-[#1B5E4B]/5"
                    : "border-gray-200 bg-white hover:border-gray-300",
                )}
              >
                <div className="flex items-center gap-3">
                  <IconComponent size={18} className={data.activityContext === ctx.value ? "text-[#1B5E4B]" : "text-gray-500"} />
                  <div>
                    <p className="font-medium text-sm">{ctx.label}</p>
                    <p className="text-xs text-gray-500">{ctx.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {data.activityContext === "competition" && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Which competition or event? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.competitionName}
            onChange={(e) => onChange({ competitionName: e.target.value })}
            placeholder="e.g. School Athletics Day, Winter Tournament Week"
            className="w-full py-3 px-4 bg-[#1B5E4B]/5 text-gray-900 border border-gray-200 rounded-xl focus:border-[#cf04d2] focus:outline-none text-sm placeholder:text-gray-400"
          />
        </div>
      )}

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
                    ? "border-[#cf04d2] bg-[#1B5E4B]/5 text-[#1B5E4B]"
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
          className="w-full py-3 px-4 bg-[#1B5E4B]/5 text-gray-900 border border-gray-200 rounded-xl focus:border-[#cf04d2] focus:outline-none transition-colors resize-none text-sm placeholder:text-gray-400"
        />
      </div>
    </div>
  );
};

export default Step4Feedback;
