"use client";

import { Formik, Form } from "formik";
import { useState } from "react";
import { SurveyInterface } from "@/models/surveys/interfaces/SurveyInterface";
import { UserSurveyStatusInterface } from "@/models/surveys/interfaces/SurveyInterface";
import SurveyQuestion from "./SurveyQuestion";
import SurveyDismissButton from "./SurveyDismissButton";
import { submitSurveyResponses } from "@/modules/surveys/actions/surveyActions";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Progress } from "@/modules/application/components/DesignSystem/ui/progress";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface SurveyModalProps {
  survey: SurveyInterface;
  status: UserSurveyStatusInterface;
}

const SurveyModal = ({ survey, status }: SurveyModalProps) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const questions = survey.questions || [];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const buildInitialValues = () => {
    const values: Record<string, any> = {};
    for (const q of questions) {
      if (q.question_type === "multi_select") {
        values[q.id] = [];
      } else if (q.question_type === "rank_order") {
        values[q.id] = {};
      } else {
        values[q.id] = "";
      }
    }
    return values;
  };

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const responses = questions.map((q) => ({
        questionId: q.id,
        answer: values[q.id],
      }));

      const result = await submitSurveyResponses(survey.id, responses);
      if (result.success) {
        toast.success("Thank you for completing the survey!");
        navigate({ to: "/dashboard" });
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Survey submission failed:", err);
      toast.error("Failed to submit survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      className="shadow-sm rounded-2xl border border-gray-200"
      style={{ backgroundColor: "#f9fefd" }}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-black text-[#1B5E4B]">{survey.name}</CardTitle>
        {survey.description && <p className="text-gray-600 text-sm">{survey.description}</p>}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <Formik initialValues={buildInitialValues()} onSubmit={handleSubmit}>
          {({ values }) => (
            <Form className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={index === currentQuestionIndex ? "block" : "hidden"}
                >
                  <SurveyQuestion question={question} name={question.id} />
                </div>
              ))}

              <div className="flex items-center justify-between pt-4">
                <div>
                  {currentQuestionIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex((i) => i - 1)}
                      className="border-gray-300 text-gray-700"
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Back
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <SurveyDismissButton surveyType={status.survey_type} />
                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                      className="text-white"
                      style={{ backgroundColor: "#1B5E4B" }}
                    >
                      Next
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="text-white"
                      style={{ backgroundColor: "#1B5E4B" }}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                      <Send size={16} className="ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
};

export default SurveyModal;
