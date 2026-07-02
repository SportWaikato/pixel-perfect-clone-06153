"use client";

import { useField } from "formik";
import { SurveyQuestionInterface } from "@/models/surveys/interfaces/SurveyInterface";
import { Checkbox } from "@/modules/application/components/DesignSystem/ui/checkbox";
import { Label } from "@/modules/application/components/DesignSystem/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/application/components/DesignSystem/ui/select";
import { FormikTextareaField } from "@/modules/common/components/Formik";
import { cn } from "@/modules/common/utils";

interface SurveyQuestionProps {
  question: SurveyQuestionInterface;
  name: string;
}

const MultiSelectQuestion = ({ question, name }: SurveyQuestionProps) => {
  const [field, , helpers] = useField<string[]>(name);
  const selected = field.value || [];

  const toggle = (option: string) => {
    if (selected.includes(option)) {
      helpers.setValue(selected.filter((v: string) => v !== option));
    } else {
      helpers.setValue([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      {(question.answer_options || []).map((option) => (
        <label
          key={option}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer",
            selected.includes(option)
              ? "border-[#0B4B39] bg-[#0B4B39]/10"
              : "border-gray-200 hover:border-[#0B4B39]/40",
          )}
        >
          <Checkbox checked={selected.includes(option)} onCheckedChange={() => toggle(option)} />
          <span className="text-sm font-medium text-gray-700">{option}</span>
        </label>
      ))}
    </div>
  );
};

const SingleSelectQuestion = ({ question, name }: SurveyQuestionProps) => {
  const [field, meta, helpers] = useField(name);

  return (
    <div className="space-y-3">
      <Select value={field.value} onValueChange={(value) => helpers.setValue(value)}>
        <SelectTrigger className={cn("w-full", meta.touched && meta.error ? "border-red-500" : "")}>
          <SelectValue placeholder="Select an answer" />
        </SelectTrigger>
        <SelectContent>
          {(question.answer_options || []).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const FreeTextQuestion = ({ name }: SurveyQuestionProps) => {
  return <FormikTextareaField name={name} placeholder="Share your thoughts..." rows={4} />;
};

const RankOrderQuestion = ({ question, name }: SurveyQuestionProps) => {
  const [field, , helpers] = useField<Record<string, number>>(name);
  const rankings = field.value || {};

  const setRank = (option: string, rank: number) => {
    const newRankings = { ...rankings };
    const existingAtRank = Object.entries(newRankings).find(([, r]) => r === rank);
    if (existingAtRank) {
      newRankings[existingAtRank[0]] = rankings[option] || 0;
    }
    newRankings[option] = rank;
    helpers.setValue(newRankings);
  };

  const maxRank = (question.answer_options || []).length;

  return (
    <div className="space-y-3">
      {(question.answer_options || []).map((option) => (
        <div key={option} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
          <span className="text-sm font-medium text-gray-700 flex-1">{option}</span>
          <div className="flex gap-1">
            {Array.from({ length: maxRank }, (_, i) => i + 1).map((rank) => (
              <button
                key={rank}
                type="button"
                onClick={() => setRank(option, rank)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                  rankings[option] === rank
                    ? "bg-[#0B4B39] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                )}
              >
                {rank}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const SurveyQuestion = ({ question, name }: SurveyQuestionProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold text-[#0B4B39]">
        {question.question_text}
        {question.is_required && <span className="text-red-400 ml-1">*</span>}
      </Label>

      {question.question_type === "multi_select" && (
        <MultiSelectQuestion question={question} name={name} />
      )}
      {question.question_type === "single_select" && (
        <SingleSelectQuestion question={question} name={name} />
      )}
      {question.question_type === "free_text" && (
        <FreeTextQuestion question={question} name={name} />
      )}
      {question.question_type === "rank_order" && (
        <RankOrderQuestion question={question} name={name} />
      )}
    </div>
  );
};

export default SurveyQuestion;
