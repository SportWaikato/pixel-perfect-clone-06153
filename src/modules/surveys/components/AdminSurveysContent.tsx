"use client";

import { useState } from "react";
import {
  SurveyInterface,
  SurveyResultsInterface,
  SurveyType,
} from "@/models/surveys/interfaces/SurveyInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/application/components/DesignSystem/ui/tabs";
import { ClipboardList, Users, CheckCircle, XCircle, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminSurveysContentProps {
  surveys: SurveyInterface[];
  results: (SurveyResultsInterface | null)[];
}

const SURVEY_TYPE_LABELS: Record<SurveyType, string> = {
  early_engagement: "Early Engagement",
  behaviour_change: "Behaviour Change",
  challenge_completion: "Challenge Completion",
  end_of_year: "End of Year",
  movement_measures: "Movement Measures",
  school_insights: "School Sport Insights",
};

const AdminSurveysContent = ({ surveys, results }: AdminSurveysContentProps) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { generateSurveyReport } = await import("@/lib/ai.functions");
      const result = await generateSurveyReport();
      setAiReport(result.report || "No data available.");
      toast.success("AI report generated");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
            Survey Results
          </h1>
          <p className="text-gray-600 mt-2">View response rates and aggregated survey results.</p>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={generating}
          className="gap-2"
          style={{ backgroundColor: "#1B5E4B" }}
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generating ? "Analysing…" : "AI Report"}
        </Button>
      </div>

      {aiReport && (
        <Card className="border-[#D103D1]/30 bg-[#f9f0f9]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#D103D1]">
              <Sparkles size={18} />
              AI-Generated Anonymous Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
              {aiReport}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={surveys[0]?.survey_type || "early_engagement"}>
        <TabsList className="flex flex-wrap gap-1 h-auto bg-gray-100 p-1 rounded-xl">
          {surveys.map((survey) => (
            <TabsTrigger key={survey.survey_type} value={survey.survey_type} className="text-sm">
              {SURVEY_TYPE_LABELS[survey.survey_type] ?? survey.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {surveys.map((survey, index) => {
          const result = results[index];
          return (
            <TabsContent key={survey.survey_type} value={survey.survey_type} className="mt-6">
              <div className="space-y-6">
                <Card className="shadow-sm rounded-2xl border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                      <ClipboardList className="w-5 h-5 text-[#1B5E4B]" />
                      {survey.name}
                    </CardTitle>
                    {survey.description && (
                      <p className="text-sm text-gray-500">{survey.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-green-700">
                          {result?.total_responses ?? 0}
                        </div>
                        <p className="text-xs text-green-600">Completed</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-xl">
                        <Users className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-yellow-700">
                          {result?.total_pending ?? 0}
                        </div>
                        <p className="text-xs text-yellow-600">Pending</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <XCircle className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-gray-600">
                          {result?.total_dismissed ?? 0}
                        </div>
                        <p className="text-xs text-gray-500">Dismissed</p>
                      </div>
                    </div>

                    {(result?.total_responses ?? 0) > 0 && (
                      <div className="text-sm text-gray-500 mb-4">
                        Response rate:{" "}
                        {Math.round(
                          ((result?.total_responses ?? 0) /
                            Math.max(
                              1,
                              (result?.total_responses ?? 0) +
                                (result?.total_pending ?? 0) +
                                (result?.total_dismissed ?? 0),
                            )) *
                            100,
                        )}
                        %
                      </div>
                    )}
                  </CardContent>
                </Card>

                {result?.questions.map((q) => (
                  <Card
                    key={q.question_id}
                    className="shadow-sm rounded-2xl border border-gray-200"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-gray-800">
                        {q.question_text}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {q.question_type.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {q.response_count} responses
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {q.response_count === 0 ? (
                        <p className="text-sm text-gray-400 italic">No responses yet</p>
                      ) : q.question_type === "free_text" ? (
                        <p className="text-sm text-gray-500">
                          {q.response_count} free-text responses collected
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(q.answer_distribution)
                            .sort(([, a], [, b]) => b - a)
                            .map(([option, count]) => {
                              const percentage = Math.round(
                                (count / Math.max(1, q.response_count)) * 100,
                              );
                              return (
                                <div key={option} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 font-medium">{option}</span>
                                    <span className="text-gray-500">
                                      {count} ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full transition-all"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: "#1B5E4B",
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AdminSurveysContent;
