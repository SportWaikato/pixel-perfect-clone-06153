"use client";

import { useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import SurveyModal from "./SurveyModal";
import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { CheckCircle } from "lucide-react";
import {
  SurveyInterface,
  UserSurveyStatusInterface,
} from "@/models/surveys/interfaces/SurveyInterface";
import { Link } from "@tanstack/react-router";

interface SurveyPageContentProps {
  pendingSurvey: {
    survey: SurveyInterface;
    status: UserSurveyStatusInterface;
  } | null;
}

const SurveyPageContent = ({ pendingSurvey }: SurveyPageContentProps) => {
  const search = useSearch({ from: "/_authenticated/survey" });

  useEffect(() => {
    const params = search as { completed?: string };
    if (params?.completed === "1") {
      toast.success("Thank you for completing the survey!");
    }
  }, [search]);

  if (!pendingSurvey) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen flex items-center justify-center">
        <Card
          className="shadow-sm rounded-2xl border border-gray-200 max-w-md w-full"
          style={{ backgroundColor: "#f9fefd" }}
        >
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-[#0B4B39] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#0B4B39] mb-2">All caught up!</h2>
            <p className="text-gray-600 mb-6">
              There are no surveys for you right now. Check back later!
            </p>
            <Button asChild className="text-white" style={{ backgroundColor: "#0B4B39" }}>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen max-w-2xl mx-auto">
      <SurveyModal survey={pendingSurvey.survey} status={pendingSurvey.status} />
    </div>
  );
};

export default SurveyPageContent;
