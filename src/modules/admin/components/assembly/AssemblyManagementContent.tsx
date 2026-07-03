import { useState, useMemo, useEffect } from "react";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { Monitor, Trophy, Loader2, Settings, Calendar, AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AssemblyWinnerInterface } from "@/models/assembly/interfaces/AssemblyWinnerInterface";
import { SchoolTermInterface } from "@/models/terms/interfaces/SchoolTermInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { SchoolTermService } from "@/models/terms/services/SchoolTermService";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";

interface AssemblyManagementContentProps {
  winners: AssemblyWinnerInterface[];
  schoolId: string;
  terms: SchoolTermInterface[];
  schools: SchoolInterface[] | null;
}

type PeriodMode = "weekly" | "monthly" | "annual" | "term";

const nzDateString = (date: Date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(date);

const rollingBounds = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return { startDate: nzDateString(start), endDate: nzDateString(end) };
};

const AssemblyManagementContent = ({
  winners,
  schoolId,
  terms,
  schools,
}: AssemblyManagementContentProps) => {
  const router = useRouter();
  const navigate = useNavigate();

  const handleSchoolChange = (newSchoolId: string) => {
    navigate({ to: `/admin/assembly?schoolId=${newSchoolId}` });
  };
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<PeriodMode>(() => {
    // Default to term mode if a current term exists, otherwise weekly
    const today = nzDateString();
    const hasCurrent = terms.some((t) => t.start_date <= today && today <= t.end_date);
    return hasCurrent ? "term" : "weekly";
  });

  const currentYear = Number(nzDateString().split("-")[0]);

  const currentTerm = useMemo(() => {
    const today = nzDateString();
    return terms.find((t) => t.start_date <= today && today <= t.end_date) ?? null;
  }, [terms]);

  const defaultYear = currentTerm?.year ?? currentYear;
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedTermId, setSelectedTermId] = useState<string>(currentTerm?.id ?? "");
  const [selectedWeek, setSelectedWeek] = useState<number>(() =>
    currentTerm ? SchoolTermService.getCurrentWeekNumber(currentTerm) : 1,
  );

  const availableYears = useMemo(() => {
    const years = new Set(terms.map((t) => t.year));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [terms, currentYear]);

  const termsForYear = useMemo(
    () => terms.filter((t) => t.year === selectedYear),
    [terms, selectedYear],
  );

  const selectedTerm = useMemo(
    () => termsForYear.find((t) => t.id === selectedTermId) ?? termsForYear[0] ?? null,
    [termsForYear, selectedTermId],
  );

  const totalWeeks = selectedTerm ? SchoolTermService.getTotalWeeks(selectedTerm) : 0;
  const weekOptions = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  useEffect(() => {
    const first = termsForYear[0];
    setSelectedTermId(first?.id ?? "");
    setSelectedWeek(1);
  }, [selectedYear, termsForYear]);

  useEffect(() => {
    setSelectedWeek(1);
  }, [selectedTermId]);

  const handleEnter = () => {
    let startDate: string;
    let endDate: string;
    let periodLabel: string;

    if (mode === "weekly") {
      const bounds = rollingBounds(7);
      startDate = bounds.startDate;
      endDate = bounds.endDate;
      periodLabel = "Last 7 days";
    } else if (mode === "monthly") {
      const bounds = rollingBounds(30);
      startDate = bounds.startDate;
      endDate = bounds.endDate;
      periodLabel = "Last 30 days";
    } else if (mode === "annual") {
      startDate = `${currentYear}-01-01`;
      endDate = `${currentYear}-12-31`;
      periodLabel = `${currentYear} Full Year`;
    } else {
      if (!selectedTerm) return;
      const bounds = SchoolTermService.getWeekBounds(selectedTerm, selectedWeek);
      startDate = bounds.startDate;
      endDate = bounds.endDate;
      periodLabel = `Week ${selectedWeek} of Term ${selectedTerm.term_number} ${selectedTerm.year}`;
    }

    setLoading(true);
    const params = new URLSearchParams({ schoolId, startDate, endDate, periodLabel });
    navigate({ to: `/admin/assembly/present?${params.toString()}` });
  };

  const canEnter = mode !== "term" || !!selectedTerm;

  const ModeButton = ({ value, label }: { value: PeriodMode; label: string }) => (
    <button
      onClick={() => setMode(value)}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        mode === value ? "bg-[#1B5E4B] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  const selectedSchoolName = schools?.find((s) => s.id === schoolId)?.name;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assembly Mode</h1>
            <p className="mt-1 text-sm text-gray-500">
              Present live school updates during assembly. Share the presentation screen with your
              audience.
            </p>
            {schools && (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  School
                </label>
                <select
                  value={schoolId}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00ACEF]"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.is_internal ? " (internal)" : ""}
                    </option>
                  ))}
                </select>
                {selectedSchoolName && (
                  <span className="text-xs text-gray-400">currently viewing</span>
                )}
              </div>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={`/admin/settings?schoolId=${schoolId}`}>
              <Settings className="h-4 w-4" /> Configure Terms
            </Link>
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Select Period</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <ModeButton value="weekly" label="Weekly" />
            <ModeButton value="monthly" label="Monthly" />
            <ModeButton value="annual" label="Annual" />
            <ModeButton value="term" label="Term Week" />
          </div>

          {mode === "term" && terms.length === 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                No school terms configured.{" "}
                <Link to={`/admin/settings?schoolId=${schoolId}`} className="font-medium underline">
                  Set up terms in Settings
                </Link>{" "}
                to use term-based weekly scoring.
              </span>
            </div>
          )}

          {mode === "term" && terms.length > 0 && (
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ACEF]"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Term
                </label>
                <select
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(e.target.value)}
                  disabled={termsForYear.length === 0}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ACEF] disabled:opacity-50"
                >
                  {termsForYear.length === 0 ? (
                    <option value="">No terms for {selectedYear}</option>
                  ) : (
                    termsForYear.map((t) => (
                      <option key={t.id} value={t.id}>
                        Term {t.term_number}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Week
                </label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  disabled={!selectedTerm}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ACEF] disabled:opacity-50"
                >
                  {weekOptions.map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {mode === "weekly" && (
            <p className="text-sm text-gray-400">Shows points earned in the last 7 days.</p>
          )}

          {mode === "monthly" && (
            <p className="text-sm text-gray-400">Shows points earned in the last 30 days.</p>
          )}

          {mode === "annual" && (
            <p className="text-sm text-gray-400">
              Shows points earned from 1 Jan – 31 Dec {currentYear}.
            </p>
          )}

          <Button
            onClick={handleEnter}
            disabled={loading || !canEnter}
            size="lg"
            className="flex items-center gap-2 bg-[#1B5E4B] px-8 py-6 text-base hover:bg-[#0a3f30] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
            {loading ? "Loading…" : "Enter Presentation Mode"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
          <Trophy className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Spot Prize Winners</h2>
          <span className="ml-auto text-sm text-gray-400">{winners.length} total</span>
        </div>

        {winners.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No prize draws have been run yet. Use Assembly Mode to draw your first winner.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {winners.map((winner) => (
              <div key={winner.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {winner.user_first_name} {winner.user_last_name}
                  </p>
                  <p className="text-sm text-gray-500">@{winner.user_username}</p>
                </div>
                {winner.house_name && (
                  <div className="flex items-center gap-2">
                    {winner.house_color && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: winner.house_color }}
                      />
                    )}
                    <span className="text-sm text-gray-600">{winner.house_name}</span>
                  </div>
                )}
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  {new Date(winner.created_at).toLocaleDateString("en-NZ", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssemblyManagementContent;
