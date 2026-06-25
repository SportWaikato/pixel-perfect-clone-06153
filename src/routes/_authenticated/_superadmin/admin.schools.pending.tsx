import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { approveSchool, rejectSchool } from "@/lib/registration.functions";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/schools/pending")({
  head: () => ({ meta: [{ title: "Pending school approvals — Karawhiua" }] }),
  component: PendingSchoolsPage,
});

interface PendingSchool {
  id: string;
  name: string;
  region: string;
  school_type: string;
  email_domain: string;
  secondary_email_domain: string | null;
  created_at: string;
  houses: { name: string; color: string }[];
}

function PendingSchoolsPage() {
  const [schools, setSchools] = useState<PendingSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("schools")
      .select(`
        id, name, region, school_type, email_domain, secondary_email_domain, created_at,
        houses (name, color)
      `)
      .or("status.eq.pending,is_active.eq.false")
      .eq("self_registered", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load pending schools");
      console.error(error);
    } else {
      setSchools((data ?? []) as unknown as PendingSchool[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (schoolId: string) => {
    setApproving(schoolId);
    try {
      await approveSchool({ data: { schoolId } });
      toast.success("School approved!");
      setSchools((prev) => prev.filter((s) => s.id !== schoolId));
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    }
    setApproving(null);
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setRejecting(true);
    try {
      await rejectSchool({ data: { schoolId: rejectModal.id, reason: rejectReason.trim() } });
      toast.success("School rejected");
      setSchools((prev) => prev.filter((s) => s.id !== rejectModal.id));
      setRejectModal(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    }
    setRejecting(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pending school approvals</h1>
          <p className="text-sm text-muted-foreground">
            {schools.length} school{schools.length !== 1 ? "s" : ""} awaiting review
          </p>
        </div>
        <Button variant="outline" onClick={fetchPending} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading pending schools…</CardContent>
        </Card>
      ) : schools.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No pending school registrations.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schools.map((school) => (
            <Card key={school.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{school.name}</CardTitle>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <CardDescription>
                      {school.region} · {school.school_type} · Submitted{" "}
                      {new Date(school.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Email domains</p>
                    <p className="font-medium">@{school.email_domain}</p>
                    {school.secondary_email_domain && (
                      <p className="font-medium text-muted-foreground">
                        @{school.secondary_email_domain} (secondary)
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Houses</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((school as any).houses as { name: string; color: string }[] | undefined)?.map(
                        (house: { name: string; color: string }) => (
                          <div
                            key={house.name}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white"
                            style={{ background: house.color }}
                          >
                            {house.name}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectModal({ id: school.id, name: school.name })}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    style={{ backgroundColor: "#0B4B39" }}
                    className="text-white hover:opacity-90"
                    onClick={() => handleApprove(school.id)}
                    disabled={approving === school.id}
                  >
                    {approving === school.id ? "Approving…" : "Approve"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject modal */}
      <Dialog
        open={!!rejectModal}
        onOpenChange={(open) => { if (!open) { setRejectModal(null); setRejectReason(""); } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {rejectModal?.name}?</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be emailed to the school admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="rejectReason">Reason *</Label>
            <Input
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Domain verification failed"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setRejectModal(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting || !rejectReason.trim()}
            >
              {rejecting ? "Rejecting…" : "Reject school"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
