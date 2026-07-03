"use client";

import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { ClipboardList } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SurveyType } from "@/models/surveys/interfaces/SurveyInterface";

interface SurveyPromptCardProps {
  surveyType: SurveyType;
  surveyName: string;
}

const SURVEY_DESCRIPTIONS: Record<SurveyType, string> = {
  early_engagement: "Share what brought you to Karawhiua",
  behaviour_change: "Tell us how Karawhiua has influenced you",
  challenge_completion: "What do you think about creating challenges?",
  end_of_year: "Reflect on your year with Karawhiua",
};

const SurveyPromptCard = ({ surveyType, surveyName }: SurveyPromptCardProps) => {
  return (
    <Card
      className="shadow-sm rounded-2xl border border-[#1B5E4B]/20"
      style={{ backgroundColor: "#f0faf6" }}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#1B5E4B" }}
          >
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#1B5E4B] text-sm sm:text-base">{surveyName}</h3>
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              {SURVEY_DESCRIPTIONS[surveyType]}
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="text-white shrink-0"
            style={{ backgroundColor: "#1B5E4B" }}
          >
            <Link to="/survey">Take Survey</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SurveyPromptCard;
