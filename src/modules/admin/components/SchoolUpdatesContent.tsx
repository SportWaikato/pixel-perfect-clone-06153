import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { SchoolUpdateInterface } from '@/models/schoolUpdates/interfaces/SchoolUpdateInterface';
import { SchoolMessageInterface } from '@/models/schoolMessages/interfaces/SchoolMessageInterface';
import { SchoolUpdateService } from '@/models/schoolUpdates/services/SchoolUpdateService';
import { SchoolMessageService } from '@/models/schoolMessages/services/SchoolMessageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';
import { FormikInputField, FormikTextareaField } from '@/modules/common/components/Formik';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { isSuperAdmin as checkIsSuperAdmin } from '@/modules/auth/utils/roleUtils';
import { StorageService } from '@/models/storage/services/StorageService';
import { ArrowLeft, MessageSquare, Trash2, MessageCircle, CheckCheck, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { Link } from '@tanstack/react-router';
interface SchoolUpdatesContentProps {
  user: UserInterface;
  schools?: SchoolInterface[];
  initialSchoolId?: string;
  backHref?: string;
}

const postSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  body: yup.string(),
});

const SchoolUpdatesContent = ({ user, schools, initialSchoolId, backHref = '/admin/dashboard' }: SchoolUpdatesContentProps) => {
  const isSuperAdmin = checkIsSuperAdmin(user);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    initialSchoolId || user.school_id || ''
  );
  const [updates, setUpdates] = useState<SchoolUpdateInterface[]>([]);
  const [messages, setMessages] = useState<SchoolMessageInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const supabase = createSupabaseClient();
  const updateService = new SchoolUpdateService(supabase);
  const messageService = new SchoolMessageService(supabase);
  const storageService = new StorageService(supabase);

  const selectedSchoolName = isSuperAdmin
    ? schools?.find(s => s.id === selectedSchoolId)?.name
    : user.school?.name;

  useEffect(() => {
    if (!selectedSchoolId) return;
    setLoading(true);

    Promise.all([
      updateService.getBySchoolId(selectedSchoolId),
      messageService.getBySchoolId(selectedSchoolId),
    ])
      .then(([fetchedUpdates, fetchedMessages]) => {
        setUpdates(fetchedUpdates);
        setMessages(fetchedMessages);
      })
      .catch(notifyAboutError)
      .finally(() => setLoading(false));
  }, [selectedSchoolId]);

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
  };

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

  const handlePost = async (values: { title: string; body: string }, { resetForm }: any) => {
    try {
      let imageUrl: string | undefined;
      let imageStoragePath: string | undefined;

      if (imageFile) {
        const uploaded = await storageService.uploadUpdateImage(imageFile);
        imageUrl = uploaded.storage_url;
        imageStoragePath = uploaded.storage_path;
      }

      const created = await updateService.create({
        schoolId: selectedSchoolId,
        createdBy: user.id,
        title: values.title.trim(),
        body: values.body.trim() || undefined,
        imageUrl,
        imageStoragePath,
      });
      setUpdates(prev => [created, ...prev]);
      resetForm();
      clearImage();
      toast.success('Update posted to all students');
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleDelete = async (update: SchoolUpdateInterface) => {
    setDeletingId(update.id);
    setUpdates(prev => prev.filter(u => u.id !== update.id));
    try {
      await updateService.deactivate(update.id);
      toast.success('Update removed');
    } catch (error) {
      setUpdates(prev => [update, ...prev]);
      notifyAboutError(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAsRead = async (msg: SchoolMessageInterface) => {
    setMarkingReadId(msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    try {
      await messageService.markAsRead(msg.id);
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: false } : m));
      notifyAboutError(error);
    } finally {
      setMarkingReadId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });

  if (isSuperAdmin && !selectedSchoolId) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Message Students</h1>
            <p className="text-gray-600">Select a school to manage updates</p>
          </div>
        </div>
        <Card>
          <CardHeader><CardTitle>Select a School</CardTitle></CardHeader>
          <CardContent>
            <Select onValueChange={handleSchoolChange}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Choose a school..." />
              </SelectTrigger>
              <SelectContent>
                {schools?.map(school => (
                  <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backHref}><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Message Students</h1>
          <p className="text-gray-600">{selectedSchoolName}</p>
        </div>
      </div>

      {/* Super admin school selector */}
      {isSuperAdmin && schools && (
        <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Choose a school..." />
          </SelectTrigger>
          <SelectContent>
            {schools.map(school => (
              <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Post new update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={18} />
            Post an Update
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{ title: '', body: '' }}
            validationSchema={postSchema}
            onSubmit={handlePost}
            validateOnBlur={false}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <FormikInputField name="title" label="Title" placeholder="e.g. Term 2 is nearly over!" />
                <FormikTextareaField name="body" label="Message (optional)" placeholder="Add more detail here..." />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Image (optional)</p>
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border" />
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
                <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#0B4B39' }}>
                  {isSubmitting ? 'Posting...' : 'Post Update'}
                </Button>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>

      {/* Existing updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Posted Updates</span>
            <Badge variant="secondary">{updates.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-gray-500 text-sm">No updates posted yet.</p>
          ) : (
            <div className="space-y-3">
              {updates.map(update => (
                <div key={update.id} className="flex items-start justify-between gap-4 p-3 border rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{update.title}</p>
                    {update.body && <p className="text-gray-500 text-sm mt-0.5 whitespace-pre-wrap">{update.body}</p>}
                    {update.image_url && (
                      <img src={update.image_url} alt="" className="mt-2 w-full rounded-lg" />
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(update.created_at)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(update)}
                    disabled={deletingId === update.id}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incoming student messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span>Student Messages</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.filter(m => !m.is_read).length > 0 && (
                <Badge className="bg-blue-500 hover:bg-blue-600">
                  {messages.filter(m => !m.is_read).length} unread
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
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 border rounded-lg space-y-2 ${!msg.is_read ? 'border-blue-200 bg-blue-50' : 'opacity-60'}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {msg.user?.first_name} {msg.user?.last_name}
                    </p>
                    {msg.user?.year_group && (
                      <Badge variant="secondary" className="text-xs">
                        {['Staff', 'Kaiako'].includes(msg.user.year_group) ? msg.user.year_group : `Year ${msg.user.year_group}`}
                      </Badge>
                    )}
                    <p className="text-xs text-gray-400 ml-auto">{formatDate(msg.created_at)}</p>
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
    </div>
  );
};

export default SchoolUpdatesContent;
