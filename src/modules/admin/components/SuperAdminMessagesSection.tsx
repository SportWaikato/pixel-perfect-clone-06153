'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, MessageCircle } from 'lucide-react';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { SchoolUpdateService } from '@/models/schoolUpdates/services/SchoolUpdateService';
import { SchoolMessageService } from '@/models/schoolMessages/services/SchoolMessageService';
import { SchoolUpdateInterface } from '@/models/schoolUpdates/interfaces/SchoolUpdateInterface';
import { SchoolMessageInterface } from '@/models/schoolMessages/interfaces/SchoolMessageInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';

const PREVIEW_COUNT = 3;
const ALL_SCHOOLS = '__all__';

interface SuperAdminMessagesSectionProps {
  schools: SchoolInterface[];
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });

const SuperAdminMessagesSection = ({ schools }: SuperAdminMessagesSectionProps) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(ALL_SCHOOLS);
  const [updates, setUpdates] = useState<SchoolUpdateInterface[]>([]);
  const [messages, setMessages] = useState<SchoolMessageInterface[]>([]);
  const [loading, setLoading] = useState(false);

  const isAllSchools = selectedSchoolId === ALL_SCHOOLS;

  useEffect(() => {
    if (!selectedSchoolId) return;

    setLoading(true);
    const supabase = createSupabaseClient();
    const updateService = new SchoolUpdateService(supabase);
    const messageService = new SchoolMessageService(supabase);

    const fetchUpdates = isAllSchools
      ? updateService.getAll()
      : updateService.getBySchoolId(selectedSchoolId);

    const fetchMessages = isAllSchools
      ? messageService.getAll()
      : messageService.getBySchoolId(selectedSchoolId);

    Promise.all([fetchUpdates, fetchMessages])
      .then(([fetchedUpdates, fetchedMessages]) => {
        setUpdates(fetchedUpdates.slice(0, PREVIEW_COUNT));
        setMessages(fetchedMessages.slice(0, PREVIEW_COUNT));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSchoolId]);

  const schoolParam = !isAllSchools && selectedSchoolId ? `?schoolId=${selectedSchoolId}` : '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>School Messages</CardTitle>
        <div className="flex items-center gap-3">
          <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a school..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SCHOOLS}>All Schools</SelectItem>
              {schools.map(school => (
                <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSchoolId && !isAllSchools && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/updates${schoolParam}`}>Manage →</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedSchoolId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Message from Staff */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500 text-white">
                  <MessageSquare size={14} />
                </div>
                <span className="font-medium text-sm">Message from Staff</span>
                <Badge variant="secondary" className="ml-auto">{updates.length}</Badge>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : updates.length === 0 ? (
                <p className="text-sm text-gray-500">No updates posted yet.</p>
              ) : (
                <div className="space-y-2">
                  {updates.map(update => (
                    <div key={update.id} className="p-2.5 border rounded-lg">
                      {isAllSchools && update.school && (
                        <p className="text-xs text-blue-600 font-medium mb-0.5">{update.school.name}</p>
                      )}
                      <p className="font-medium text-sm">{update.title}</p>
                      {update.body && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{update.body}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(update.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message from Kids */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
                  <MessageCircle size={14} />
                </div>
                <span className="font-medium text-sm">Message from Kids</span>
                <Badge variant="secondary" className="ml-auto">{messages.length}</Badge>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-500">No student messages yet.</p>
              ) : (
                <div className="space-y-2">
                  {messages.map(msg => (
                    <div key={msg.id} className="p-2.5 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
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
                      {isAllSchools && msg.school && (
                        <p className="text-xs text-emerald-600 font-medium mb-0.5">{msg.school.name}</p>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-2">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminMessagesSection;
