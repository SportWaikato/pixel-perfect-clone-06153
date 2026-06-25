import { useMemo, useState, ReactNode } from 'react';
import NextImage from 'next/image';
import { AssetInterface } from '@/models/assets/interfaces/AssetInterface';
import { Card, CardContent } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Input } from '@/modules/application/components/DesignSystem/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/application/components/DesignSystem/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/application/components/DesignSystem/ui/table';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { AssetService } from '@/models/assets/services/AssetService';
import useAdminData from '@/modules/common/hooks/useAdminData';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { Search, Download, FolderOpen, FileText, Image, Loader2, Video } from 'lucide-react';

interface ManageContentContentProps {
  schoolId?: string | null;
}

type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileTypeBadge = ({ fileType }: { fileType: string }) => {
  const isPdf = fileType === 'application/pdf';
  const isVideo = fileType === 'video/mp4';
  const isImage = fileType.startsWith('image/');
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {isPdf ? <FileText size={10} /> : isVideo ? <Video size={10} /> : isImage ? <img size={10} /> : <FileText size={10} />}
      {isPdf ? 'PDF' : isVideo ? 'MP4' : isImage ? 'Image' : 'File'}
    </Badge>
  );
};

const renderDescription = (text: string | null | undefined) => {
  if (!text) return '—';
  const urlRegex = /https?:\/\/[^\s]+/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline break-all">
        {match[0]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
};

const AssetThumbnail = ({ asset }: { asset: AssetInterface }) => {
  if (asset.file_type.startsWith('image/')) {
    return (
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
        <NextImage src={asset.file_url} alt={asset.name} fill className="object-cover" />
      </div>
    );
  }
  const isPdf = asset.file_type === 'application/pdf';
  const isVideo = asset.file_type === 'video/mp4';
  if (isVideo) {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-purple-50">
        <Video size={20} className="text-purple-400" />
      </div>
    );
  }
  return (
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded ${isPdf ? 'bg-red-50' : 'bg-blue-50'}`}>
      <FileText size={20} className={isPdf ? 'text-red-400' : 'text-blue-400'} />
    </div>
  );
};

const downloadFile = async (url: string, filename: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
};

const ManageContentContent = ({ schoolId }: ManageContentContentProps) => {
  const assetService = new AssetService(createSupabaseClient());
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { filteredData: assets, data: allAssets, loading, searchTerm, setSearchTerm } = useAdminData<AssetInterface>({
    fetchFn: () => assetService.getActive(schoolId ?? undefined),
    filterFn: (asset, term) =>
      asset.name.toLowerCase().includes(term.toLowerCase()) ||
      (asset.description?.toLowerCase().includes(term.toLowerCase()) ?? false),
  });

  const displayedAssets = useMemo(() => {
    const result = [...assets];
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title_asc': return a.name.localeCompare(b.name);
        case 'title_desc': return b.name.localeCompare(a.name);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [assets, sortBy]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Media</h1>
        <p className="text-gray-600">Promotional files to help you promote Karawhiua in your school</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="title_asc">Title A–Z</SelectItem>
            <SelectItem value="title_desc">Title Z–A</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="gap-1">
          <FolderOpen size={14} />
          {allAssets.length} {allAssets.length === 1 ? 'file' : 'files'}
        </Badge>
      </div>

      {displayedAssets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {searchTerm ? (
              <>
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                <p className="text-gray-600">No files match your search criteria.</p>
              </>
            ) : (
              <>
                <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Available</h3>
                <p className="text-gray-600">Promotional files will appear here once they are published.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedAssets.map(asset => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AssetThumbnail asset={asset} />
                      <span className="font-medium">{asset.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 max-w-xs">
                    {renderDescription(asset.description)}
                  </TableCell>
                  <TableCell>
                    <FileTypeBadge fileType={asset.file_type} />
                  </TableCell>
                  <TableCell className="text-gray-500">{formatFileSize(asset.file_size)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={downloadingId === asset.id}
                      onClick={async () => {
                        setDownloadingId(asset.id);
                        try {
                          await downloadFile(asset.file_url, asset.name);
                        } catch (error) {
                          notifyAboutError(error);
                        } finally {
                          setDownloadingId(null);
                        }
                      }}
                    >
                      {downloadingId === asset.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default ManageContentContent;
