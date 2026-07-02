"use client";

import { useState, useMemo, useCallback } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { SchoolTermInterface } from "@/models/terms/interfaces/SchoolTermInterface";
import { UserReport, SchoolVerification } from "@/models/reporting/interfaces/ReportingInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Input } from "@/modules/application/components/DesignSystem/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/application/components/DesignSystem/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/application/components/DesignSystem/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/application/components/DesignSystem/ui/tabs";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { ReportingService } from "@/models/reporting/services/ReportingService";
import { isSuperAdmin as checkIsSuperAdmin } from "@/modules/auth/utils/roleUtils";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import {
  FileText,
  Download,
  Search,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ReportsContentProps {
  user: UserInterface;
  schools: SchoolInterface[];
  currentTerm: SchoolTermInterface | null;
}

function getTermName(term: SchoolTermInterface | null): string {
  if (!term) return "Current Term";
  return `Term ${term.term_number} ${term.year}`;
}

const ReportsContent = ({ user, schools, currentTerm }: ReportsContentProps) => {
  const isSuperAdmin = checkIsSuperAdmin(user);
  const reportingService = useMemo(() => new ReportingService(createSupabaseClient()), []);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    isSuperAdmin ? schools[0]?.id || "" : user.school_id,
  );
  const [startDate, setStartDate] = useState<string>(
    currentTerm?.start_date || new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    currentTerm?.end_date || new Date().toISOString().split("T")[0],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [reportData, setReportData] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportLoaded, setReportLoaded] = useState(false);

  const [verificationData, setVerificationData] = useState<SchoolVerification[]>([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationLoaded, setVerificationLoaded] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!selectedSchoolId) return;
    setLoading(true);
    try {
      const data = await reportingService.getUniqueUserReport(selectedSchoolId, startDate, endDate);
      setReportData(data);
      setReportLoaded(true);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setLoading(false);
    }
  }, [selectedSchoolId, startDate, endDate, reportingService]);

  const handleExport = async () => {
    if (!selectedSchoolId) return;
    try {
      const csv = await reportingService.exportUserReport(selectedSchoolId, startDate, endDate);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user-report-${startDate}-to-${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const fetchVerification = useCallback(async () => {
    if (!selectedSchoolId) return;
    setVerificationLoading(true);
    try {
      const data = await reportingService.verifySchoolTotals(selectedSchoolId);
      setVerificationData(data);
      setVerificationLoaded(true);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setVerificationLoading(false);
    }
  }, [selectedSchoolId, reportingService]);

  const filteredReport = useMemo(() => {
    if (!searchTerm) return reportData;
    const term = searchTerm.toLowerCase();
    return reportData.filter(
      (u) =>
        u.first_name.toLowerCase().includes(term) ||
        u.last_name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        (u.email && u.email.toLowerCase().includes(term)),
    );
  }, [reportData, searchTerm]);

  const termName = getTermName(currentTerm);

  const totalMinutes = filteredReport.reduce((s, u) => s + (u.total_minutes || 0), 0);
  const totalPoints = filteredReport.reduce((s, u) => s + (u.total_points || 0), 0);
  const totalActivities = filteredReport.reduce((s, u) => s + (u.total_activities || 0), 0);

  const inconsistentHouses = verificationData.filter((v) => !v.is_consistent);
  const schoolTotalRow = verificationData.find((v) => v.house_name === "__school_total__");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">Unique user reporting and data verification</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {isSuperAdmin && schools.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">School</label>
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button
              onClick={fetchReport}
              disabled={loading || !selectedSchoolId}
              className="gap-2"
              style={{ backgroundColor: "#0B4B39" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="report" className="space-y-6">
        <TabsList>
          <TabsTrigger value="report" className="gap-2">
            <FileText size={16} />
            User Report
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-2">
            <ShieldCheck size={16} />
            Data Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="space-y-4">
          {reportLoaded && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredReport.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(totalMinutes).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(totalPoints).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalActivities.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={handleExport} className="gap-2">
                  <Download size={16} />
                  Export CSV
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  {filteredReport.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No users found for the selected date range.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>House</TableHead>
                            <TableHead>Year Group</TableHead>
                            <TableHead className="text-right">Minutes</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead className="text-right">Activities</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReport.map((u) => (
                            <TableRow key={u.user_id}>
                              <TableCell className="font-medium">
                                {u.first_name} {u.last_name}
                              </TableCell>
                              <TableCell>@{u.username}</TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {u.email || "-"}
                              </TableCell>
                              <TableCell>{u.house_name || "-"}</TableCell>
                              <TableCell>{u.year_group || "-"}</TableCell>
                              <TableCell className="text-right">
                                {Math.round(u.total_minutes).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {Math.round(u.total_points).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">{u.total_activities}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!reportLoaded && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <FileText size={40} className="text-gray-300" />
                <p className="font-medium text-gray-700">
                  Select a date range and generate a report
                </p>
                <p className="text-sm text-gray-500">
                  Choose your school and date range above, then click Generate Report.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#00ACEF" }} />
                <span className="text-gray-500">Generating report...</span>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={fetchVerification}
              disabled={verificationLoading || !selectedSchoolId}
              className="gap-2"
              style={{ backgroundColor: "#0B4B39" }}
            >
              {verificationLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              Run Verification
            </Button>
          </div>

          {verificationLoaded && (
            <>
              {inconsistentHouses.length === 0 &&
              (!schoolTotalRow || schoolTotalRow.is_consistent) ? (
                <Card>
                  <CardContent className="flex items-center gap-3 py-8">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">All totals are consistent</p>
                      <p className="text-sm text-gray-500">
                        Cached totals match live calculations for all houses and the school.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center gap-3 py-8">
                    <ShieldAlert className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {inconsistentHouses.length} discrepancy
                        {inconsistentHouses.length !== 1 ? "ies" : "y"} found
                      </p>
                      <p className="text-sm text-gray-500">
                        Some cached totals do not match live calculations. Review the table below.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">House & School Totals Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entity</TableHead>
                          <TableHead className="text-right">Cached Points</TableHead>
                          <TableHead className="text-right">Live Points</TableHead>
                          <TableHead className="text-right">Difference</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verificationData.map((v) => (
                          <TableRow key={v.house_id}>
                            <TableCell className="font-medium">
                              {v.house_name === "__school_total__" ? "School Total" : v.house_name}
                            </TableCell>
                            <TableCell className="text-right">
                              {Math.round(v.cached_total_points).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {Math.round(v.live_total_points).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {Math.round(
                                v.live_total_points - v.cached_total_points,
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {v.is_consistent ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle size={12} className="mr-1" />
                                  Consistent
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  <XCircle size={12} className="mr-1" />
                                  Mismatch
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!verificationLoaded && !verificationLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <ShieldCheck size={40} className="text-gray-300" />
                <p className="font-medium text-gray-700">
                  Run verification to check data consistency
                </p>
                <p className="text-sm text-gray-500">
                  Compares cached totals against live activity calculations.
                </p>
              </CardContent>
            </Card>
          )}

          {verificationLoading && (
            <Card>
              <CardContent className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#00ACEF" }} />
                <span className="text-gray-500">Verifying data...</span>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsContent;
