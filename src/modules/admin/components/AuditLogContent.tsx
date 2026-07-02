"use client";

import { useState, useMemo, useCallback } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { AuditLogInterface } from "@/models/audit/interfaces/AuditLogInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
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
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { AuditLogService } from "@/models/audit/services/AuditLogService";
import { isSuperAdmin as checkIsSuperAdmin } from "@/modules/auth/utils/roleUtils";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { ScrollText, Loader2, Filter, User, Calendar, ArrowRightLeft } from "lucide-react";

interface AuditLogContentProps {
  user: UserInterface;
  schools: SchoolInterface[];
}

const ACTION_COLORS: Record<string, string> = {
  toggle_active: "bg-blue-100 text-blue-800",
  delete_user: "bg-red-100 text-red-800",
  promote_user: "bg-purple-100 text-purple-800",
  change_house: "bg-amber-100 text-amber-800",
  change_school: "bg-cyan-100 text-cyan-800",
  change_year_group: "bg-indigo-100 text-indigo-800",
  change_name: "bg-gray-100 text-gray-800",
  change_username: "bg-gray-100 text-gray-800",
  create_school: "bg-green-100 text-green-800",
  update_school: "bg-blue-100 text-blue-800",
  delete_school: "bg-red-100 text-red-800",
  toggle_school_active: "bg-blue-100 text-blue-800",
  approve_challenge: "bg-green-100 text-green-800",
  reject_challenge: "bg-red-100 text-red-800",
  publish_challenge: "bg-emerald-100 text-emerald-800",
  unpublish_challenge: "bg-amber-100 text-amber-800",
  delete_challenge: "bg-red-100 text-red-800",
  reject_activity: "bg-red-100 text-red-800",
  restore_activity: "bg-green-100 text-green-800",
};

const ACTION_TYPES = [
  "toggle_active",
  "delete_user",
  "promote_user",
  "change_house",
  "change_school",
  "change_year_group",
  "change_name",
  "change_username",
  "create_school",
  "update_school",
  "delete_school",
  "toggle_school_active",
  "approve_challenge",
  "reject_challenge",
  "publish_challenge",
  "unpublish_challenge",
  "delete_challenge",
  "reject_activity",
  "restore_activity",
];

const AuditLogContent = ({ user, schools }: AuditLogContentProps) => {
  const isSuperAdmin = checkIsSuperAdmin(user);
  const auditLogService = useMemo(() => new AuditLogService(createSupabaseClient()), []);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    isSuperAdmin ? schools[0]?.id || "" : user.school_id,
  );
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [entries, setEntries] = useState<AuditLogInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [limit, setLimit] = useState(100);

  const fetchAuditLog = useCallback(async () => {
    if (!selectedSchoolId) return;
    setLoading(true);
    try {
      const data = await auditLogService.getAuditLog(selectedSchoolId, limit);
      setEntries(data);
      setLoaded(true);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setLoading(false);
    }
  }, [selectedSchoolId, limit, auditLogService]);

  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (actionFilter !== "all") {
      filtered = filtered.filter((e) => e.action === actionFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          (e.actor_first_name && e.actor_first_name.toLowerCase().includes(term)) ||
          (e.actor_last_name && e.actor_last_name.toLowerCase().includes(term)) ||
          (e.actor_username && e.actor_username.toLowerCase().includes(term)) ||
          e.action.toLowerCase().includes(term) ||
          e.target_type.toLowerCase().includes(term),
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((e) => e.created_at >= dateFrom);
    }

    if (dateTo) {
      const to = dateTo + "T23:59:59";
      filtered = filtered.filter((e) => e.created_at <= to);
    }

    return filtered;
  }, [entries, actionFilter, searchTerm, dateFrom, dateTo]);

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-NZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatValues = (values: Record<string, unknown> | null) => {
    if (!values) return "-";
    return Object.entries(values)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(", ");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-2">Track admin actions and changes across the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter size={16} />
            Filters
          </CardTitle>
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
              <label className="text-sm font-medium text-gray-700">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Limit</label>
              <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={fetchAuditLog}
              disabled={loading || !selectedSchoolId}
              className="gap-2"
              style={{ backgroundColor: "#0B4B39" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ScrollText size={16} />}
              Load Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {loaded && (
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search by actor name, username, action, or target type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {loaded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                Audit Entries
              </span>
              <Badge variant="secondary">
                {filteredEntries.length} of {entries.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No audit log entries found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatTimestamp(entry.created_at)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">
                              {entry.actor_first_name} {entry.actor_last_name}
                            </span>
                            {entry.actor_username && (
                              <span className="text-sm text-gray-500 ml-1">
                                @{entry.actor_username}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-800"}
                          >
                            {entry.action.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{entry.target_type}</div>
                          {entry.target_id && (
                            <div className="text-xs text-gray-400 font-mono">
                              {entry.target_id.substring(0, 8)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs">
                          {entry.old_values && entry.new_values ? (
                            <div className="space-y-1">
                              <div className="text-red-600 line-through text-xs">
                                {formatValues(entry.old_values)}
                              </div>
                              <div className="flex items-center">
                                <ArrowRightLeft size={12} className="text-gray-400 mr-1" />
                              </div>
                              <div className="text-green-600 text-xs">
                                {formatValues(entry.new_values)}
                              </div>
                            </div>
                          ) : entry.new_values ? (
                            <div className="text-green-600 text-xs">
                              {formatValues(entry.new_values)}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!loaded && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <ScrollText size={40} className="text-gray-300" />
            <p className="font-medium text-gray-700">Load the audit log to view entries</p>
            <p className="text-sm text-gray-500">Select a school and click Load Log above.</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#00ACEF]" />
            <span className="text-gray-500">Loading audit log...</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditLogContent;
