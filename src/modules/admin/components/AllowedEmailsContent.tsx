import { useState, useEffect, useMemo } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { AllowedEmailInterface } from "@/models/allowed-emails/interfaces/AllowedEmailInterface";
import { BlockedEmailInterface } from "@/models/blocked-emails/interfaces/BlockedEmailInterface";
import { AllowedEmailService } from "@/models/allowed-emails/services/AllowedEmailService";
import { BlockedEmailService } from "@/models/blocked-emails/services/BlockedEmailService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Input } from "@/modules/application/components/DesignSystem/ui/input";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/application/components/DesignSystem/ui/select";
import { Textarea } from "@/modules/application/components/DesignSystem/ui/textarea";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { isSuperAdmin as checkIsSuperAdmin } from "@/modules/auth/utils/roleUtils";
import useAdminData from "@/modules/common/hooks/useAdminData";
import { ArrowLeft, Globe, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { Link } from "@tanstack/react-router";
interface AllowedEmailsContentProps {
  user: UserInterface;
  schools?: SchoolInterface[];
  backHref?: string;
  defaultSchoolId?: string;
}

function parseEmailsFromText(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)),
    ),
  ];
}

function countInvalidEmails(raw: string): number {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return tokens.filter((s) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)).length;
}

const AllowedEmailsContent = ({
  user,
  schools,
  backHref: backHrefProp,
  defaultSchoolId,
}: AllowedEmailsContentProps) => {
  const isSuperAdmin = checkIsSuperAdmin(user);

  const initialSchoolId = defaultSchoolId || user.school_id || "";
  const initialSchool = defaultSchoolId
    ? schools?.find((s) => s.id === defaultSchoolId)
    : (user.school as SchoolInterface | undefined);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(initialSchoolId);
  const [selectedSchool, setSelectedSchool] = useState<SchoolInterface | undefined>(initialSchool);
  const [registrationMethod, setRegistrationMethod] = useState<"domain_blocklist" | "allowlist">(
    initialSchool?.registration_method ?? "domain_blocklist",
  );

  // Allow list state
  const [bulkAllowInput, setBulkAllowInput] = useState("");
  const [noteAllowInput, setNoteAllowInput] = useState("");
  const [isAddingAllowed, setIsAddingAllowed] = useState(false);
  const [sortBy, setSortBy] = useState<"email" | "date_added" | "registered" | "pending">("email");

  // Block list state
  const [bulkBlockInput, setBulkBlockInput] = useState("");
  const [noteBlockInput, setNoteBlockInput] = useState("");
  const [isAddingBlocked, setIsAddingBlocked] = useState(false);
  const [blockedEmails, setBlockedEmails] = useState<BlockedEmailInterface[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  const allowedService = useMemo(() => new AllowedEmailService(createSupabaseClient()), []);
  const blockedService = useMemo(() => new BlockedEmailService(createSupabaseClient()), []);

  const {
    data: allowedEmails,
    filteredData,
    loading: allowedLoading,
    refresh,
    setData: setAllowedEmails,
    searchTerm,
    setSearchTerm,
  } = useAdminData<AllowedEmailInterface>({
    fetchFn: () =>
      selectedSchoolId === "__all__"
        ? allowedService.getAll()
        : allowedService.getBySchoolId(selectedSchoolId),
    filterFn: (item, term) => item.email.includes(term.toLowerCase()),
    fetchOnMount: false,
  });

  const fetchBlockedEmails = async (schoolId: string) => {
    if (!schoolId || schoolId === "__all__") return;
    setBlockedLoading(true);
    try {
      const data = await blockedService.getBySchoolId(schoolId);
      setBlockedEmails(data);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setBlockedLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSchoolId || selectedSchoolId === "__all__") return;
    if (registrationMethod === "allowlist") {
      refresh();
    } else {
      fetchBlockedEmails(selectedSchoolId);
    }
  }, [selectedSchoolId, registrationMethod]);

  const ALL_SCHOOLS_VALUE = "__all__";

  const handleSchoolChange = (schoolId: string) => {
    if (schoolId === ALL_SCHOOLS_VALUE) {
      setSelectedSchoolId(ALL_SCHOOLS_VALUE);
      setSelectedSchool(undefined);
      setAllowedEmails([]);
      setBlockedEmails([]);
      setBulkAllowInput("");
      setBulkBlockInput("");
      return;
    }
    const school = schools?.find((s) => s.id === schoolId);
    setSelectedSchoolId(schoolId);
    setSelectedSchool(school);
    setRegistrationMethod(school?.registration_method ?? "domain_blocklist");
    setAllowedEmails([]);
    setBlockedEmails([]);
    setBulkAllowInput("");
    setBulkBlockInput("");
  };

  const getSchoolName = (schoolId: string) =>
    schools?.find((s) => s.id === schoolId)?.name || schoolId;

  // Allow list handlers
  const parsedAllowEmails = parseEmailsFromText(bulkAllowInput);
  const invalidAllowCount = bulkAllowInput.trim() ? countInvalidEmails(bulkAllowInput) : 0;

  const handleBulkAllow = async () => {
    if (parsedAllowEmails.length === 0) {
      toast.error("No valid email addresses found");
      return;
    }
    setIsAddingAllowed(true);
    try {
      const { added, skipped } = await allowedService.bulkAdd(
        selectedSchoolId,
        parsedAllowEmails,
        user.id,
        noteAllowInput.trim() || undefined,
      );
      setAllowedEmails((prev) => [...added, ...prev]);
      setBulkAllowInput("");
      if (skipped.length === 0) {
        toast.success(
          `${added.length} email${added.length === 1 ? "" : "s"} added to the allow list`,
        );
      } else {
        toast.success(`${added.length} added, ${skipped.length} already existed and were skipped`);
      }
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setIsAddingAllowed(false);
    }
  };

  const handleRemoveAllowed = async (entry: AllowedEmailInterface) => {
    setAllowedEmails((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await allowedService.remove(entry.id);
      toast.success(`${entry.email} removed from allow list`);
    } catch (error) {
      setAllowedEmails((prev) => [entry, ...prev]);
      notifyAboutError(error);
    }
  };

  // Block list handlers
  const parsedBlockEmails = parseEmailsFromText(bulkBlockInput);
  const invalidBlockCount = bulkBlockInput.trim() ? countInvalidEmails(bulkBlockInput) : 0;

  const handleBulkBlock = async () => {
    if (parsedBlockEmails.length === 0) {
      toast.error("No valid email addresses found");
      return;
    }
    setIsAddingBlocked(true);
    try {
      const { added, skipped } = await blockedService.bulkAdd(
        selectedSchoolId,
        parsedBlockEmails,
        user.id,
        noteBlockInput.trim() || undefined,
      );
      setBlockedEmails((prev) => [...added, ...prev]);
      setBulkBlockInput("");
      if (skipped.length === 0) {
        toast.success(
          `${added.length} email${added.length === 1 ? "" : "s"} added to the block list`,
        );
      } else {
        toast.success(`${added.length} added, ${skipped.length} already existed and were skipped`);
      }
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setIsAddingBlocked(false);
    }
  };

  const handleRemoveBlocked = async (entry: BlockedEmailInterface) => {
    setBlockedEmails((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await blockedService.remove(entry.id);
      toast.success(`${entry.email} removed from block list`);
    } catch (error) {
      setBlockedEmails((prev) => [entry, ...prev]);
      notifyAboutError(error);
    }
  };

  // Allow list sort
  const registered = allowedEmails.filter((e) => e.user_id !== null).length;
  const pending = allowedEmails.filter((e) => e.user_id === null).length;

  const sortedAllowedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case "date_added":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "registered":
        if (a.user_id && !b.user_id) return -1;
        if (!a.user_id && b.user_id) return 1;
        return a.email.localeCompare(b.email);
      case "pending":
        if (!a.user_id && b.user_id) return -1;
        if (a.user_id && !b.user_id) return 1;
        return a.email.localeCompare(b.email);
      default:
        return a.email.localeCompare(b.email);
    }
  });

  const backHref = backHrefProp || (isSuperAdmin ? "/admin" : "/school");

  if (isSuperAdmin && !selectedSchoolId) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backHref}>
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
              Registration Access
            </h1>
            <p className="text-gray-600">Select a school to manage its registration settings</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select a School</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleSchoolChange}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Choose a school..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Schools</SelectItem>
                {schools?.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loading = registrationMethod === "allowlist" ? allowedLoading : blockedLoading;

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={backHref}>
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
            Registration Access
          </h1>
          <p className="text-gray-600">{selectedSchool?.name || getSchoolName(selectedSchoolId)}</p>
        </div>
      </div>

      {/* Registration method info card */}
      {selectedSchoolId !== ALL_SCHOOLS_VALUE && (
        <Card
          className={
            registrationMethod === "domain_blocklist"
              ? "border-green-200 bg-green-50"
              : "border-amber-200 bg-amber-50"
          }
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              {registrationMethod === "domain_blocklist" ? (
                <Globe className="text-green-600 shrink-0" size={18} />
              ) : (
                <ShieldCheck className="text-amber-600 shrink-0" size={18} />
              )}
              <div>
                {registrationMethod === "domain_blocklist" ? (
                  <>
                    <p className="font-medium text-sm text-green-900">
                      Domain-based registration active
                    </p>
                    <p className="text-sm text-green-700">
                      Students with a valid
                      {selectedSchool?.email_domain ? ` @${selectedSchool.email_domain}` : ""}{" "}
                      school email can register, unless blocked below.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-sm text-amber-900">Allow list active</p>
                    <p className="text-sm text-amber-700">
                      Only listed email addresses can register at this school.
                    </p>
                    {allowedEmails.length === 0 && !allowedLoading && (
                      <p className="text-xs text-amber-700 mt-1 font-medium">
                        Warning: The allow list is empty — no students can currently register.
                      </p>
                    )}
                  </>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Registration method is configured in School Settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* School selector for super admins */}
      {isSuperAdmin && schools && (
        <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Schools</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* ── Domain + Block List ── */}
      {registrationMethod === "domain_blocklist" && selectedSchoolId !== ALL_SCHOOLS_VALUE && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Block Emails
                {blockedEmails.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {blockedEmails.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={`Paste email addresses to block, separated by commas, spaces, or new lines:\n\nstudent1@school.edu\nstudent2@school.edu`}
                value={bulkBlockInput}
                onChange={(e) => setBulkBlockInput(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
              {bulkBlockInput.trim() && (
                <p className="text-xs text-gray-500">
                  {parsedBlockEmails.length} valid email{parsedBlockEmails.length !== 1 ? "s" : ""}
                  {invalidBlockCount > 0 && (
                    <span className="text-amber-600">
                      {" "}
                      · {invalidBlockCount} invalid (will be skipped)
                    </span>
                  )}
                </p>
              )}
              <div className="flex gap-3 items-center">
                <Input
                  placeholder="Optional note (e.g. Parent opt-out)"
                  value={noteBlockInput}
                  onChange={(e) => setNoteBlockInput(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  onClick={handleBulkBlock}
                  disabled={isAddingBlocked || parsedBlockEmails.length === 0}
                  variant="destructive"
                >
                  {isAddingBlocked
                    ? "Blocking..."
                    : `Block ${parsedBlockEmails.length > 0 ? parsedBlockEmails.length : ""} Email${parsedBlockEmails.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blocked Emails</CardTitle>
            </CardHeader>
            <CardContent>
              {blockedEmails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No emails blocked — all students with a valid school domain can register.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedEmails.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{entry.email}</span>
                        {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          Blocked{" "}
                          {new Date(entry.created_at).toLocaleDateString("en-NZ", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-4 shrink-0"
                        onClick={() => handleRemoveBlocked(entry)}
                        title="Remove from block list"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Allow List ── */}
      {registrationMethod === "allowlist" && selectedSchoolId !== ALL_SCHOOLS_VALUE && (
        <>
          {allowedEmails.length > 0 && (
            <div className="flex gap-4 text-sm text-gray-600">
              <span className="font-medium text-green-700">{registered} registered</span>
              <span className="text-gray-400">·</span>
              <span>{pending} pending</span>
              <span className="text-gray-400">·</span>
              <span>{allowedEmails.length} total</span>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Add Permitted Emails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={`Paste email addresses separated by commas, spaces, or new lines:\n\nstudent1@school.edu\nstudent2@school.edu, student3@school.edu`}
                value={bulkAllowInput}
                onChange={(e) => setBulkAllowInput(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
              {bulkAllowInput.trim() && (
                <p className="text-xs text-gray-500">
                  {parsedAllowEmails.length} valid email{parsedAllowEmails.length !== 1 ? "s" : ""}
                  {invalidAllowCount > 0 && (
                    <span className="text-amber-600">
                      {" "}
                      · {invalidAllowCount} invalid (will be skipped)
                    </span>
                  )}
                </p>
              )}
              <div className="flex gap-3 items-center">
                <Input
                  placeholder="Optional note (e.g. Year 10 class)"
                  value={noteAllowInput}
                  onChange={(e) => setNoteAllowInput(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  onClick={handleBulkAllow}
                  disabled={isAddingAllowed || parsedAllowEmails.length === 0}
                >
                  {isAddingAllowed
                    ? "Adding..."
                    : `Add ${parsedAllowEmails.length > 0 ? parsedAllowEmails.length : ""} Email${parsedAllowEmails.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle>
                  Allowed Emails
                  {allowedEmails.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {allowedEmails.length}
                    </Badge>
                  )}
                </CardTitle>
                {allowedEmails.length > 0 && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48 h-8 text-sm"
                    />
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                      <SelectTrigger className="w-40 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email A–Z</SelectItem>
                        <SelectItem value="date_added">Date Added</SelectItem>
                        <SelectItem value="registered">Registered First</SelectItem>
                        <SelectItem value="pending">Pending First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {allowedEmails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>The allow list is empty — no students can currently register.</p>
                  <p className="text-sm mt-1">Add emails above to grant access.</p>
                </div>
              ) : sortedAllowedData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No emails match your search.</div>
              ) : (
                <div className="space-y-2">
                  {sortedAllowedData.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{entry.email}</span>
                        {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          Added{" "}
                          {new Date(entry.created_at).toLocaleDateString("en-NZ", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        {entry.user_id ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 border">
                            Registered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Pending
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveAllowed(entry)}
                          title="Remove from allow list"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* All-schools view (super admin) — combined allow list read-only */}
      {selectedSchoolId === ALL_SCHOOLS_VALUE && (
        <Card>
          <CardHeader>
            <CardTitle>
              All Allowed Emails
              {allowedEmails.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {allowedEmails.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allowedEmails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No emails on any allow list.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allowedEmails.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{entry.email}</span>
                      <p className="text-xs text-blue-600 mt-0.5">
                        {getSchoolName(entry.school_id)}
                      </p>
                      {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {entry.user_id ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 border">
                          Registered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AllowedEmailsContent;
