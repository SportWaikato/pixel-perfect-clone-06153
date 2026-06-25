'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Input } from '@/modules/application/components/DesignSystem/ui/input';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Label } from '@/modules/application/components/DesignSystem/ui/label';
import { Copy, Check, Trash2, UserPlus, Link as LinkIcon, Search } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { SuperAdminInviteInterface } from '@/models/invites/interfaces/SuperAdminInviteInterface';
import { createSuperAdminInvite, revokeSuperAdminInvite } from '@/modules/admin/actions/createSuperAdminInvite';
import { formatDistanceToNow, isPast } from 'date-fns';

interface SuperAdminInviteSectionProps {
  initialInvites: SuperAdminInviteInterface[];
}

const getInviteStatus = (invite: SuperAdminInviteInterface): 'used' | 'expired' | 'pending' => {
  if (invite.used_at) return 'used';
  if (isPast(new Date(invite.expires_at))) return 'expired';
  return 'pending';
};

const SuperAdminInviteSection = ({ initialInvites }: SuperAdminInviteSectionProps) => {
  const [invites, setInvites] = useState<SuperAdminInviteInterface[]>(initialInvites);
  const [email, setEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [inviteSearch, setInviteSearch] = useState('');
  const [invitePage, setInvitePage] = useState(0);
  const INVITE_PAGE_SIZE = 10;

  const handleGenerate = async () => {
    if (!email.trim()) {
      toast.error('Enter an email address');
      return;
    }
    setGenerating(true);
    setGeneratedUrl(null);
    try {
      const { invite, url } = await createSuperAdminInvite(email.trim());
      setInvites((prev) => [invite, ...prev]);
      setGeneratedUrl(url);
      setEmail('');
      toast.success('Invite link generated');
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Invite link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await revokeSuperAdminInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success('Invite revoked');
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setRevoking(null);
    }
  };

  const statusBadge = (invite: SuperAdminInviteInterface) => {
    const status = getInviteStatus(invite);
    if (status === 'used') return <Badge className="bg-green-100 text-green-800">Used</Badge>;
    if (status === 'expired') return <Badge variant="secondary">Expired</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Generate invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Generate Super Admin Invite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the email address for the new super admin. Share the generated link with them — they&apos;ll use it to create their account.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                style={{ backgroundColor: '#0B4B39' }}
              >
                {generating ? 'Generating…' : 'Generate Link'}
              </Button>
            </div>
          </div>

          {generatedUrl && (
            <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LinkIcon className="h-4 w-4 text-green-600" />
                Invite link ready — copy and share it now
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedUrl}
                  className="font-mono text-xs bg-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={() => handleCopy(generatedUrl)}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Link expires in 7 days and can only be used once.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite list */}
      <Card>
        <CardHeader>
          <CardTitle>Invite History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search by email…"
              value={inviteSearch}
              onChange={(e) => { setInviteSearch(e.target.value); setInvitePage(0); }}
              className="pl-10"
            />
          </div>
          {(() => {
            const filtered = invites.filter(i =>
              i.email.toLowerCase().includes(inviteSearch.toLowerCase())
            );
            const page = filtered.slice(invitePage * INVITE_PAGE_SIZE, (invitePage + 1) * INVITE_PAGE_SIZE);
            return filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No invites found</p>
            ) : (
            <>
              <div className="space-y-3">
                {page.map((invite) => {
                  const status = getInviteStatus(invite);
                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between gap-4 p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                          {status === 'pending' && (
                            <> · expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}</>
                          )}
                          {status === 'used' && invite.used_at && (
                            <> · used {formatDistanceToNow(new Date(invite.used_at), { addSuffix: true })}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge(invite)}
                        {status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            disabled={revoking === invite.id}
                            onClick={() => handleRevoke(invite.id)}
                            title="Revoke invite"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {filtered.length > INVITE_PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t text-sm text-gray-500">
                  <span>
                    {invitePage * INVITE_PAGE_SIZE + 1}–{Math.min((invitePage + 1) * INVITE_PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvitePage(p => p - 1)}
                      disabled={invitePage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvitePage(p => p + 1)}
                      disabled={(invitePage + 1) * INVITE_PAGE_SIZE >= filtered.length}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminInviteSection;
