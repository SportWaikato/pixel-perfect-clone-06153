import { useState, useEffect, useMemo } from "react";
import { Formik, Form, FormikHelpers } from "formik";
import * as yup from "yup";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolUpdateInterface } from "@/models/schoolUpdates/interfaces/SchoolUpdateInterface";
import { SchoolMessageInterface } from "@/models/schoolMessages/interfaces/SchoolMessageInterface";
import { SurveyInterface } from "@/models/surveys/interfaces/SurveyInterface";
import { SchoolUpdateService } from "@/models/schoolUpdates/services/SchoolUpdateService";
import { SchoolMessageService } from "@/models/schoolMessages/services/SchoolMessageService";
import { SurveyService } from "@/models/surveys/services/SurveyService";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { isSchoolAdmin, isSuperAdmin } from "@/modules/auth/utils/roleUtils";
import { StorageService } from "@/models/storage/services/StorageService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { FormikInputField, FormikTextareaField } from "@/modules/common/components/Formik";
import {
  MessageSquare,
  Trash2,
  MessageCircle,
  CheckCheck,
  ImagePlus,
  X,
  ChevronRight,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { Link } from "@tanstack/react-router";

interface AnnouncementsPageProps {
  user: UserInterface;
}

const postSchema = yup.object().shape({
  title: yup.string().required("Title is required"),
  body: yup.string(),
});

const messageSchema = yup.object().shape({
  message: yup.string().required("Please enter a message"),
});

const PREVIEW_LENGTH = 60;

const bodyPreview = (body: string) =>
  body.length > PREVIEW_LENGTH ? body.slice(0, PREVIEW_LENGTH) + "\u2026" : body;

const SURVEY_TAG = /\[survey:([a-f0-9-]{36})\]/g;

const renderBody = (body: string, maxLength?: number) => {
  const parts: Array<{ type: "text" | "survey"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const text = body || "";
  SURVEY_TAG.lastIndex = 0;

  while ((match = SURVEY_TAG.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index).trim();
      if (textBefore) parts.push({ type: "text", value: textBefore });
    }
    parts.push({ type: "survey", value: match[1] });
    lastIndex = SURVEY_TAG.lastIndex;
  }
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining) parts.push({ type: "text", value: remaining });
  }
  if (parts.length === 0) {
    parts.push({ type: "text", value: text });
  }

  if (maxLength && parts.length === 1 && parts[0].type === "text") {
    parts[0].value = parts[0].value.length > maxLength
      ? parts[0].value.slice(0, maxLength) + "\u2026"
      : parts[0].value;
  }

  return parts;
};

const resolveSurveyName = (surveyId: string, surveys: SurveyInterface[]) => {
  return surveys.find((s) => s.id === surveyId)?.name || "Survey";
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const SURVEY_DESCRIPTIONS: Record<string, string> = {
  early_engagement: "Share what brought you to Karawhiua",
  behaviour_change: "Tell us how Karawhiua has influenced you",
  challenge_completion: "What do you think about creating challenges?",
  end_of_year: "Reflect on your year with Karawhiua",
  movement_measures: "Help Sport Waikato understand how you move",
};

const AnnouncementsPage = ({ user }: AnnouncementsPageProps) => {
  const admin = isSchoolAdmin(user) || isSuperAdmin(user);
  const superAdmin = isSuperAdmin(user);
  const schoolId = user.school_id ?? "";

  const [updates, setUpdates] = useState<SchoolUpdateInterface[]>([]);
  const [messages, setMessages] = useState<SchoolMessageInterface[]>([]);
  const [surveys, setSurveys] = useState<SurveyInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sendToAllSchools, setSendToAllSchools] = useState(false);
  const [attachedSurveyId, setAttachedSurveyId] = useState<string>("");

  const supabase = useMemo(() => createSupabaseClient(), []);
  const updateService = useMemo(() => new SchoolUpdateService(supabase), [supabase]);
  const messageService = useMemo(() => new SchoolMessageService(supabase), [supabase]);
  const storageService = useMemo(() => new StorageService(supabase), [supabase]);

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);

    if (admin) {
      Promise.all([updateService.getBySchoolId(schoolId), messageService.getBySchoolId(schoolId)])
        .then(([fetchedUpdates, fetchedMessages]) => {
          setUpdates(fetchedUpdates);
          setMessages(fetchedMessages);
        })
        .catch(notifyAboutError)
        .finally(() => setLoading(false));
    } else {
      updateService
        .getWithReadStatus(schoolId, user.id)
        .then((fetchedUpdates) => {
          setUpdates(fetchedUpdates);
          updateService.markAllAsRead(schoolId, user.id).catch(() => {});
        })
        .catch(notifyAboutError)
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  useEffect(() => {
    if (superAdmin) {
      const surveyService = new SurveyService(supabase);
      surveyService
        .getAllSurveys()
        .then((all) => setSurveys(all.filter((s) => s.is_active)))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superAdmin]);

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handlePost = async (
    values: { title: string; body: string },
    { resetForm, setSubmitting }: FormikHelpers<{ title: string; body: string }>,
  ) => {
    try {
      if (!schoolId && !sendToAllSchools) {
        toast.error("No school selected");
        setSubmitting(false);
        return;
      }
      let imageUrl: string | undefined;
      let imageStoragePath: string | undefined;
      if (imageFile) {
        const uploaded = await storageService.uploadUpdateImage(imageFile);
        imageUrl = uploaded.storage_url;
        imageStoragePath = uploaded.storage_path;
      }

      const bodyWithSurvey = attachedSurveyId
        ? `${values.body.trim() || ""}\n\n[survey:${attachedSurveyId}]`
        : values.body.trim() || undefined;

      if (sendToAllSchools) {
        const schoolService = new SchoolService(supabase);
        const allSchools = await schoolService.getAll(true);
        let created = 0;
        await Promise.all(
          allSchools.map(async (s) => {
            await updateService.create({
              schoolId: s.id,
              createdBy: user.id,
              title: values.title.trim(),
              body: bodyWithSurvey || undefined,
              imageUrl,
              imageStoragePath,
            });
            created++;
          }),
        );
        setUpdates((prev) => {
          return prev;
        });
        resetForm();
        clearImage();
        setSendToAllSchools(false);
        setAttachedSurveyId("");
        setSubmitting(false);
        toast.success(`Update posted to ${created} schools`);
        if (schoolId) {
          updateService.getBySchoolId(schoolId).then(setUpdates).catch(notifyAboutError);
        }
        return;
      }

      const created = await updateService.create({
        schoolId,
        createdBy: user.id,
        title: values.title.trim(),
        body: bodyWithSurvey || undefined,
        imageUrl,
        imageStoragePath,
      });
      setUpdates((prev) => [created, ...prev]);
      resetForm();
      clearImage();
      setAttachedSurveyId("");
      setSubmitting(false);
      toast.success("Update posted to all students");
    } catch (error) {
      setSubmitting(false);
      notifyAboutError(error);
    }
  };

  const handleDelete = async (update: SchoolUpdateInterface) => {
    setDeletingId(update.id);
    setUpdates((prev) => prev.filter((u) => u.id !== update.id));
    try {
      await updateService.deactivate(update.id);
      toast.success("Update removed");
    } catch (error) {
      setUpdates((prev) => [update, ...prev]);
      notifyAboutError(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAsRead = async (msg: SchoolMessageInterface) => {
    setMarkingReadId(msg.id);
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
    try {
      await messageService.markAsRead(msg.id);
    } catch (error) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: false } : m)));
      notifyAboutError(error);
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleSendMessage = async (
    values: { message: string },
    { resetForm }: FormikHelpers<{ message: string }>,
  ) => {
    if (!schoolId) return;
    try {
      await messageService.create({
        schoolId,
        userId: user.id,
        message: values.message.trim(),
      });
      resetForm();
      toast.success("Message sent to your school admin");
    } catch (error) {
      notifyAboutError(error);
    }
  };

  if (!schoolId) {
    return (
      <div className="p-6 max-w-4xl mx-auto min-h-screen">
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1B5E4B]/10 flex items-center justify-center">
            <Megaphone size={28} className="text-[#1B5E4B]" />
          </div>
          <h2 className="text-xl font-bold text-[#1B5E4B]">No school linked</h2>
          <p className="text-gray-500">Your account is not linked to a school yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
              Announcements
            </h1>
            <p className="mt-1 text-body text-brand-dark/70">
              {admin
                ? "Post updates and manage messages from your students."
                : "The latest from your school."}
            </p>
          </div>

          {admin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare size={18} />
                  Post an Update
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Formik
                  initialValues={{ title: "", body: "" }}
                  validationSchema={postSchema}
                  onSubmit={handlePost}
                  validateOnBlur={false}
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-4">
                      <FormikInputField
                        name="title"
                        label="Title"
                        placeholder="e.g. Term 2 is nearly over!"
                      />
                      <FormikTextareaField
                        name="body"
                        label="Message (optional)"
                        placeholder="Add more detail here..."
                      />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Image (optional)</p>
                        {imagePreview ? (
                          <div className="relative inline-block">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full max-h-48 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={clearImage}
                              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                            >
                              <X size={14} className="text-gray-600" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                            <ImagePlus size={16} />
                            Add image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                          </label>
                        )}
                      </div>
                      {superAdmin && (
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">Attach Survey</label>
                          <select
                            value={attachedSurveyId}
                            onChange={(e) => setAttachedSurveyId(e.target.value)}
                            className="w-full py-2 px-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-[#1B5E4B]/40 focus:outline-none text-sm"
                          >
                            <option value="">None</option>
                            {surveys.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {superAdmin && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendToAllSchools}
                            onChange={(e) => setSendToAllSchools(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1B5E4B] focus:ring-[#1B5E4B]"
                          />
                          <span className="text-sm text-gray-700">Send to all schools</span>
                        </label>
                      )}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ backgroundColor: "#1B5E4B" }}
                      >
                        {isSubmitting ? "Posting..." : "Post Update"}
                      </Button>
                    </Form>
                  )}
                </Formik>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl" />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1B5E4B]/10 flex items-center justify-center">
                <Megaphone size={24} className="text-[#1B5E4B]" />
              </div>
              <h3 className="text-lg font-bold text-[#1B5E4B]">No announcements yet</h3>
              <p className="text-sm text-gray-500">
                {admin
                  ? "Post your first update using the form above."
                  : "Your school hasn't posted any updates yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((update) => {
                const isExpanded = expandedIds.has(update.id);
                const hasMore = !!update.body && update.body.length > PREVIEW_LENGTH;
                return (
                  <div
                    key={update.id}
                    onClick={() => hasMore && toggleExpand(update.id)}
                    className={`bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm${hasMore ? " cursor-pointer" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!update.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <p
                          className={`text-base font-semibold ${update.is_read ? "text-gray-700" : "text-gray-900"}`}
                        >
                          {update.title}
                        </p>
                      </div>
                      {update.body ? (
                        <div className="text-sm text-gray-800 mt-0.5">
                          {isExpanded ? (
                            renderBody(update.body).map((part, i) =>
                              part.type === "survey" ? (
                                <Button
                                  key={i}
                                  size="sm"
                                  asChild
                                  style={{ backgroundColor: "#1B5E4B" }}
                                  className="mt-1"
                                >
                                  <Link to="/survey" search={{ surveyId: part.value }}>
                                    <ClipboardList size={14} className="mr-1" />
                                    Take Survey: {resolveSurveyName(part.value, surveys)}
                                  </Link>
                                </Button>
                              ) : (
                                <span key={i} className="whitespace-pre-wrap">{part.value}</span>
                              ),
                            )
                          ) : (
                            renderBody(update.body, PREVIEW_LENGTH).map((part, i) =>
                              part.type === "survey" ? (
                                <Button
                                  key={i}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6 px-2"
                                >
                                  <ClipboardList size={12} className="mr-1" />
                                  Survey
                                </Button>
                              ) : (
                                <span key={i}>{part.value}</span>
                              ),
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 mt-0.5">
                          {formatDate(update.created_at)}
                        </p>
                      )}
                      {update.image_url && (
                        <img
                          src={update.image_url}
                          alt=""
                          className="mt-2 w-full max-w-md rounded-lg"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {admin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(update);
                          }}
                          disabled={deletingId === update.id}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                      <ChevronRight
                        size={16}
                        className={`text-gray-400 transition-transform mt-0.5${hasMore ? (isExpanded ? " rotate-90" : "") : " opacity-0"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {admin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={18} />
                    <span>Student Messages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {messages.filter((m) => !m.is_read).length > 0 && (
                      <Badge className="bg-blue-500 hover:bg-blue-600">
                        {messages.filter((m) => !m.is_read).length} unread
                      </Badge>
                    )}
                    <Badge variant="secondary">{messages.length} total</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-sm">No messages from students yet.</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 border rounded-lg space-y-2 ${!msg.is_read ? "border-blue-200 bg-blue-50" : "opacity-60"}`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {msg.user?.first_name} {msg.user?.last_name}
                          </p>
                          {msg.user?.year_group && (
                            <Badge variant="secondary" className="text-xs">
                              {["Staff", "Kaiako"].includes(msg.user.year_group)
                                ? msg.user.year_group
                                : `Year ${msg.user.year_group}`}
                            </Badge>
                          )}
                          <p className="text-xs text-gray-400 ml-auto">
                            {formatDate(msg.created_at)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700">{msg.message}</p>
                        {!msg.is_read && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            disabled={markingReadId === msg.id}
                            onClick={() => handleMarkAsRead(msg)}
                          >
                            <CheckCheck size={13} />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!admin && (
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle style={{ color: "#1B5E4B" }}>Need to get in touch?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Send a message to your school admin. Your name, school and class year will be
                  automatically captured.
                </p>
                <Formik
                  initialValues={{ message: "" }}
                  validationSchema={messageSchema}
                  onSubmit={handleSendMessage}
                  validateOnBlur={false}
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-4">
                      <FormikTextareaField name="message" label="Your message" placeholder="" />
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                        style={{ backgroundColor: "#1B5E4B" }}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
                    </Form>
                  )}
                </Formik>
              </CardContent>
            </Card>
          )}
        </div>

        {superAdmin && (
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="sticky top-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList size={18} />
                    Surveys
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {surveys.length === 0 ? (
                    <p className="text-sm text-gray-500">No active surveys.</p>
                  ) : (
                    surveys.map((survey) => (
                      <Button
                        key={survey.id}
                        variant="outline"
                        asChild
                        className="w-full justify-start text-left h-auto py-3 px-3"
                      >
                        <Link to="/survey" search={{ surveyId: survey.id }}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{survey.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {survey.description || SURVEY_DESCRIPTIONS[survey.survey_type] || ""}
                            </p>
                          </div>
                        </Link>
                      </Button>
                    ))
                  )}
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs"
                  >
                    <Link to="/admin/surveys">Manage Surveys</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
