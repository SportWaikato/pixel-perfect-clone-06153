import { useState, useEffect, useMemo, ReactNode } from "react";
import { AssetInterface } from "@/models/assets/interfaces/AssetInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/modules/application/components/DesignSystem/ui/alert-dialog";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { AssetService } from "@/models/assets/services/AssetService";
import { SchoolService } from "@/models/schools/services/SchoolService";
import useAdminData from "@/modules/common/hooks/useAdminData";
import AssetCreateEditDialog from "./AssetCreateEditDialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FolderOpen,
  ArrowLeft,
  FileText,
  Image,
  Download,
  Loader2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { Link } from "@tanstack/react-router";
type SortOption = "newest" | "oldest" | "title_asc" | "title_desc";

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileTypeBadge = ({ fileType }: { fileType: string }) => {
  const isPdf = fileType === "application/pdf";
  const isVideo = fileType === "video/mp4";
  const isImage = fileType.startsWith("image/");
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {isPdf ? (
        <FileText size={10} />
      ) : isVideo ? (
        <Video size={10} />
      ) : isImage ? (
        <Image size={10} />
      ) : (
        <FileText size={10} />
      )}
      {isPdf ? "PDF" : isVideo ? "MP4" : isImage ? "Image" : "File"}
    </Badge>
  );
};

const renderDescription = (text: string | null | undefined) => {
  if (!text) return "—";
  const urlRegex = /https?:\/\/[^\s]+/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline break-all"
      >
        {match[0]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
};

const AssetThumbnail = ({ asset }: { asset: AssetInterface }) => {
  if (asset.file_type.startsWith("image/")) {
    return (
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
        <img
          src={asset.file_url}
          alt={asset.name}
          className="absolute inset-0 w-full h-full object-cover object-cover"
        />
      </div>
    );
  }
  const isPdf = asset.file_type === "application/pdf";
  const isVideo = asset.file_type === "video/mp4";
  if (isVideo) {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-purple-50">
        <Video size={20} className="text-purple-400" />
      </div>
    );
  }
  return (
    <div
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded ${isPdf ? "bg-red-50" : "bg-blue-50"}`}
    >
      <FileText size={20} className={isPdf ? "text-red-400" : "text-blue-400"} />
    </div>
  );
};

const downloadFile = async (url: string, filename: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
};

const AssetManagementContent = () => {
  const assetService = new AssetService(createSupabaseClient());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetInterface | null>(null);
  const [schools, setSchools] = useState<SchoolInterface[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterSchoolId, setFilterSchoolId] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const schoolService = new SchoolService(createSupabaseClient());
    schoolService
      .getAll(true)
      .then(setSchools)
      .catch(() => {});
  }, []);

  const {
    filteredData: assets,
    data: allAssets,
    loading,
    searchTerm,
    setSearchTerm,
    refresh: fetchAssets,
  } = useAdminData({
    fetchFn: () => assetService.getAll(),
    filterFn: (asset, term) =>
      asset.name.toLowerCase().includes(term.toLowerCase()) ||
      (asset.description?.toLowerCase().includes(term.toLowerCase()) ?? false),
  });

  const schoolMap = useMemo(() => {
    const map: Record<string, string> = {};
    schools.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [schools]);

  const displayedAssets = useMemo(() => {
    let result = [...assets];

    if (filterSchoolId !== "all") {
      result = result.filter(
        (a) => a.school_ids.length === 0 || a.school_ids.includes(filterSchoolId),
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title_asc":
          return a.name.localeCompare(b.name);
        case "title_desc":
          return b.name.localeCompare(a.name);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [assets, sortBy, filterSchoolId]);

  const handleCreateAsset = () => {
    setEditingAsset(null);
    setShowCreateDialog(true);
  };

  const handleEditAsset = (asset: AssetInterface) => {
    setEditingAsset(asset);
    setShowCreateDialog(true);
  };

  const handleDeleteAsset = async (asset: AssetInterface) => {
    try {
      await assetService.deleteWithCleanup(asset.id);
      toast.success("Asset deleted successfully!");
      await fetchAssets();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleSuccess = async () => {
    setShowCreateDialog(false);
    setEditingAsset(null);
    await fetchAssets();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
              Manage Media
            </h1>
            <p className="text-gray-600">Upload and manage promotional files for school admins</p>
          </div>
        </div>
        <Button
          onClick={handleCreateAsset}
          className="gap-2"
          style={{ backgroundColor: "#00ACEF" }}
        >
          <Plus size={16} />
          Upload Asset
        </Button>
      </div>

      {/* Search + sort + school filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterSchoolId} onValueChange={setFilterSchoolId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All schools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All schools</SelectItem>
            {schools.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
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
          {allAssets.length} total
        </Badge>
      </div>

      {displayedAssets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {searchTerm || filterSchoolId !== "all" ? (
              <>
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-600">Try adjusting your search or filters.</p>
              </>
            ) : (
              <>
                <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assets Yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload promotional files for school admins to download.
                </p>
                <Button
                  onClick={handleCreateAsset}
                  className="gap-2"
                  style={{ backgroundColor: "#00ACEF" }}
                >
                  <Plus size={16} />
                  Upload Asset
                </Button>
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
                <TableHead>Schools</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AssetThumbnail asset={asset} />
                      <span className="font-medium">{asset.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 max-w-xs break-words">
                    {renderDescription(asset.description)}
                  </TableCell>
                  <TableCell>
                    <FileTypeBadge fileType={asset.file_type} />
                  </TableCell>
                  <TableCell className="text-gray-500">{formatFileSize(asset.file_size)}</TableCell>
                  <TableCell>
                    {asset.school_ids.length === 0 ? (
                      <span className="text-xs text-gray-400">All schools</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {asset.school_ids.slice(0, 2).map((id) => (
                          <Badge key={id} variant="outline" className="text-xs">
                            {schoolMap[id] ?? "…"}
                          </Badge>
                        ))}
                        {asset.school_ids.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{asset.school_ids.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={asset.is_active ? "default" : "secondary"}
                      style={{ backgroundColor: asset.is_active ? "#19AA4B" : undefined }}
                    >
                      {asset.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
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
                      </Button>
                      <Button
                        onClick={() => handleEditAsset(asset)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Edit size={14} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{asset.name}&quot;? This will
                              permanently remove the file and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAsset(asset)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Asset
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AssetCreateEditDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingAsset(null);
        }}
        onSuccess={handleSuccess}
        asset={editingAsset}
      />
    </div>
  );
};

export default AssetManagementContent;
