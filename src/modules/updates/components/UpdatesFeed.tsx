'use client';

import { useState, useEffect, useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { SchoolUpdateInterface } from '@/models/schoolUpdates/interfaces/SchoolUpdateInterface';
import { SchoolUpdateService } from '@/models/schoolUpdates/services/SchoolUpdateService';
import { SchoolMessageService } from '@/models/schoolMessages/services/SchoolMessageService';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { FormikTextareaField } from '@/modules/common/components/Formik';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import Link from 'next/link';

interface UpdatesFeedProps {
  user: UserInterface;
  initialUpdates?: SchoolUpdateInterface[];
  embedded?: boolean;
}

const messageSchema = yup.object().shape({
  message: yup.string().required('Please enter a message'),
});

const PREVIEW_LENGTH = 60;

const bodyPreview = (body: string) =>
  body.length > PREVIEW_LENGTH ? body.slice(0, PREVIEW_LENGTH) + '…' : body;

const UpdatesFeed = ({ user, initialUpdates = [], embedded = false }: UpdatesFeedProps) => {
  const [updates, setUpdates] = useState<SchoolUpdateInterface[]>(initialUpdates);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const supabase = useMemo(() => createSupabaseClient(), []);
  const updateService = useMemo(() => new SchoolUpdateService(supabase), [supabase]);
  const messageService = useMemo(() => new SchoolMessageService(supabase), [supabase]);

  // Mark all as read silently once the feed is visible
  useEffect(() => {
    if (user.school_id) {
      updateService.markAllAsRead(user.school_id, user.id).catch(() => {});
    }
  }, [user.school_id, user.id]);

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSendMessage = async (values: { message: string }, { resetForm }: any) => {
    if (!user.school_id) return;
    try {
      await messageService.create({
        schoolId: user.school_id,
        userId: user.id,
        message: values.message.trim(),
      });
      resetForm();
      toast.success('Message sent to your school admin');
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderUpdateItem = (update: SchoolUpdateInterface) => {
    const isExpanded = expandedIds.has(update.id);
    const hasMore = !!update.body && update.body.length > PREVIEW_LENGTH;

    return (
      <div
        key={update.id}
        onClick={() => hasMore && toggleExpand(update.id)}
        className={`bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm${hasMore ? ' cursor-pointer' : ''}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!update.is_read && (
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            )}
            <p className={`text-base font-semibold ${update.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
              {update.title}
            </p>
          </div>
          {update.body ? (
            <p className={`text-sm text-gray-800 mt-0.5${isExpanded ? ' whitespace-pre-wrap' : ''}`}>
              {isExpanded ? update.body : bodyPreview(update.body)}
            </p>
          ) : (
            <p className="text-sm text-gray-800 mt-0.5">{formatDate(update.created_at)}</p>
          )}
          {update.image_url && (
            <img
              src={update.image_url}
              alt=""
              className="mt-2 w-full rounded-lg"
            />
          )}
        </div>
        <ChevronRight
          size={16}
          className={`text-gray-400 shrink-0 transition-transform mt-0.5${hasMore ? (isExpanded ? ' rotate-90' : '') : ' opacity-0'}`}
        />
      </div>
    );
  };

  const contactForm = (
    <div className="bg-white rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold" style={{ color: '#0B4B39' }}>Need to get in touch?</h3>
        <p className="text-sm text-gray-600 mt-1">
          Use this form to send us a message, suggestions or feedback. Your name, school and class year will be automatically captured.
        </p>
      </div>
      <Formik
        initialValues={{ message: '' }}
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
              style={{ backgroundColor: '#0B4B39' }}
            >
              {isSubmitting ? 'Sending...' : 'Save'}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );

  const updatesList = loading ? (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>)}
    </div>
  ) : updates.length === 0 ? (
    <div className="bg-white rounded-xl p-6 text-center">
      <p className="text-gray-500">No updates from your school yet.</p>
    </div>
  ) : (
    <div className="space-y-3">
      {updates.map(renderUpdateItem)}
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Updates &amp; alerts</h2>
        {updatesList}
        {contactForm}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0EFEB' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft size={20} /></Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Updates &amp; alerts</h1>
        </div>
        {updatesList}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#0B4B39' }}>Need to get in touch?</h2>
            <p className="text-sm text-gray-600 mt-1">
              Use this form to send us a message, suggestions or feedback. Your name, school and class year will be automatically captured.
            </p>
          </div>
          <Formik
            initialValues={{ message: '' }}
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
                  style={{ backgroundColor: '#0B4B39' }}
                >
                  {isSubmitting ? 'Sending...' : 'Save'}
                </Button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default UpdatesFeed;
