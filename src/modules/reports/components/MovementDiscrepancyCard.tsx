import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Loader2, BarChart3, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { m } from "framer-motion";
import { toast } from "sonner";

interface DiscrepancyItem {
  userId: string;
  weeklyHoursBand: string | null;
  actualMinutes: number;
  reportedMeets: boolean;
  actualMeets: boolean;
  status: string;
  satisfactionTopTwoBox: boolean;
}

interface DiscrepancySummary {
  totalRespondents: number;
  aligned: number;
  reportedHigher: number;
  recordedHigher: number;
  insufficientData: number;
  satisfactionTopTwoBox: number;
}

interface MovementDiscrepancyCardProps {
  compact?: boolean;
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  Aligned: { icon: CheckCircle2, color: "#1B5E4B", label: "Aligned" },
  "Reported higher than recorded": { icon: TrendingUp, color: "#D103D1", label: "Reported > Actual" },
  "Recorded higher than reported": { icon: TrendingDown, color: "#118061", label: "Actual > Reported" },
  "Insufficient data": { icon: HelpCircle, color: "#9CA3AF", label: "No data" },
};

const MovementDiscrepancyCard = ({ compact }: MovementDiscrepancyCardProps) => {
  const [data, setData] = useState<{ items: DiscrepancyItem[]; summary: DiscrepancySummary } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { fetchMovementDiscrepancy } = await import("@/lib/reports.functions");
      const result = await fetchMovementDiscrepancy();
      setData(result as any);
    } catch (err: any) {
      toast.error(err.message || "Failed to load discrepancy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B5E4B]" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.totalRespondents === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1B5E4B]" />
            Survey vs Real Movement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            No survey responses yet. Students need to complete the Movement Measures Survey first.
          </p>
          <Button variant="outline" size="sm" className="mx-auto block" onClick={load}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { summary, items } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1B5E4B]" />
            Survey vs Real Movement
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {summary.totalRespondents} respondents · {Math.round((summary.satisfactionTopTwoBox / summary.totalRespondents) * 100)}% top-two-box satisfaction
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: summary.aligned, label: "Aligned", color: "#1B5E4B" },
            { value: summary.reportedHigher, label: "Reported Higher", color: "#D103D1" },
            { value: summary.recordedHigher, label: "Recorded Higher", color: "#118061" },
            { value: summary.insufficientData, label: "Insufficient Data", color: "#9CA3AF" },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 rounded-xl bg-gray-50">
              <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Discrepancy breakdown */}
        {!compact && (
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            {summary.aligned > 0 && (
              <m.div
                className="h-3 float-left"
                style={{ width: `${(summary.aligned / summary.totalRespondents) * 100}%`, backgroundColor: "#1B5E4B" }}
                initial={{ width: 0 }}
                animate={{ width: `${(summary.aligned / summary.totalRespondents) * 100}%` }}
                title={`Aligned: ${summary.aligned}`}
              />
            )}
            {summary.reportedHigher > 0 && (
              <m.div
                className="h-3 float-left"
                style={{ width: `${(summary.reportedHigher / summary.totalRespondents) * 100}%`, backgroundColor: "#D103D1" }}
                initial={{ width: 0 }}
                animate={{ width: `${(summary.reportedHigher / summary.totalRespondents) * 100}%` }}
                title={`Reported higher: ${summary.reportedHigher}`}
              />
            )}
            {summary.recordedHigher > 0 && (
              <m.div
                className="h-3 float-left"
                style={{ width: `${(summary.recordedHigher / summary.totalRespondents) * 100}%`, backgroundColor: "#118061" }}
                initial={{ width: 0 }}
                animate={{ width: `${(summary.recordedHigher / summary.totalRespondents) * 100}%` }}
                title={`Recorded higher: ${summary.recordedHigher}`}
              />
            )}
          </div>
        )}

        {/* Per-respondent list */}
        <div className={`${compact ? "max-h-48" : "max-h-64"} overflow-y-auto space-y-2`}>
          {items.map((item) => {
            const cfg = statusConfig[item.status] || statusConfig["Insufficient data"];
            const Icon = cfg.icon;
            return (
              <div key={item.userId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={14} style={{ color: cfg.color }} />
                  <span className="text-gray-500 text-xs">{item.userId}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">{item.weeklyHoursBand || "?"} reported</span>
                  <span className="font-semibold" style={{ color: cfg.color }}>{Math.round(item.actualMinutes / 60)}h actual</span>
                  <Badge className="text-[10px]" style={{ backgroundColor: cfg.color + "18", color: cfg.color, borderColor: cfg.color + "30" }}>
                    {cfg.label}
                  </Badge>
                  {item.satisfactionTopTwoBox && (
                    <Badge className="text-[10px] bg-green-100 text-green-700">✓ Satisfied</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MovementDiscrepancyCard;
