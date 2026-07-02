"use client";

import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { SurveyType } from "@/models/surveys/interfaces/SurveyInterface";
import { dismissSurvey } from "@/modules/surveys/actions/surveyActions";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface SurveyDismissButtonProps {
  surveyType: SurveyType;
  label?: string;
}

const SurveyDismissButton = ({
  surveyType,
  label = "Remind me later",
}: SurveyDismissButtonProps) => {
  const navigate = useNavigate();

  const handleDismiss = async () => {
    try {
      const result = await dismissSurvey(surveyType);
      if (result.success) {
        toast.success("We'll remind you next time");
        navigate({ to: "/dashboard" });
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleDismiss}
      className="text-gray-500 hover:text-gray-700"
    >
      {label}
    </Button>
  );
};

export default SurveyDismissButton;
