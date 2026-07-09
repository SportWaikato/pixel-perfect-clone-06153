import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolMessageInterface } from "@/models/schoolMessages/interfaces/SchoolMessageInterface";
import { SchoolMessageService } from "@/models/schoolMessages/services/SchoolMessageService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { useState, useMemo } from "react";
import { Formik, Form } from "formik";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { Send, Loader2, CheckCheck } from "lucide-react";
import { FormikTextareaField } from "@/modules/common/components/Formik";

export const Route = createFileRoute("/_authenticated/_admin/school/messages")({
  head: () => ({ meta: [{ title: "School Messages — Karawhiua" }] }),
  beforeLoad: async ({ context }) => {
    const profile = context.profile as UserInterface | null;
    if (!profile?.school_id) return { messages: [] as SchoolMessageInterface[] };

    const supabase = createSupabaseClient();
    const svc = new SchoolMessageService(supabase);
    const messages = await svc.getBySchoolId(profile.school_id);
    return { messages };
  },
  component: Page,
});

function Page() {
  const { profile, messages: initialMessages } = Route.useRouteContext();
  const user = profile as UserInterface;
  const schoolId = user?.school_id;

  const [messages, setMessages] = useState<SchoolMessageInterface[]>(
    (initialMessages as SchoolMessageInterface[]) || [],
  );
  const [sending, setSending] = useState(false);

  const messageService = useMemo(() => new SchoolMessageService(createSupabaseClient()), []);

  if (!profile) return null;

  const refresh = async () => {
    if (!user.school_id) return;
    try {
      const data = await messageService.getBySchoolId(user.school_id);
      setMessages(data);
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleSend = async (values: { message: string }) => {
    if (!user.school_id || !values.message.trim()) return;
    setSending(true);
    try {
      await messageService.create({
        schoolId: user.school_id!,
        userId: user.id,
        message: values.message.trim(),
      });
      toast.success("Message sent");
      await refresh();
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
          School Messages
        </h1>
        <p className="text-gray-600 mt-2">Send messages and updates to students and staff</p>
      </div>

      <Card className="shadow-sm rounded-2xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Compose Message</CardTitle>
        </CardHeader>
        <CardContent>
          <Formik initialValues={{ message: "" }} onSubmit={handleSend}>
            {({ resetForm }) => (
              <Form>
                <FormikTextareaField name="message" placeholder="Write your message..." rows={3} />
                <div className="flex justify-end mt-3">
                  <Button
                    type="submit"
                    disabled={sending}
                    className="gap-2"
                    style={{ backgroundColor: "#1B5E4B", color: "white" }}
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Send Message
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>

      <Card className="shadow-sm rounded-2xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCheck size={16} />
            Sent Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages sent yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Use the form above to send your first message.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {msg.user?.first_name} {msg.user?.last_name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {msg.is_read ? "Read" : "Unread"}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
