'use client';

import { useState, useEffect } from 'react';
import { AssetInterface } from '@/models/assets/interfaces/AssetInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/modules/application/components/DesignSystem/ui/dialog';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { AssetService } from '@/models/assets/services/AssetService';
import { SchoolService } from '@/models/schools/services/SchoolService';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { FormikInputField, FormikSelectField, FormikTextareaField } from '@/modules/common/components/Formik';
import { SelectItem } from '@/modules/application/components/DesignSystem/ui/select';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import Image from 'next/image';
import SchoolCheckboxList from '@/modules/admin/components/SchoolCheckboxList';

interface AssetCreateEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: AssetInterface | null;
}

interface AssetFormValues {
  name: string;
  description: string;
  is_active: 'true' | 'false';
}

const validationSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  description: yup.string(),
  is_active: yup.string().oneOf(['true', 'false']).required(),
});

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/rtf', 'text/rtf',
];
const MAX_SIZE = 200 * 1024 * 1024;

const AssetCreateEditDialog = ({ isOpen, onClose, onSuccess, asset }: AssetCreateEditDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [schools, setSchools] = useState<SchoolInterface[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>(asset?.school_ids || []);
  const [isDragging, setIsDragging] = useState(false);

  const assetService = new AssetService(createSupabaseClient());
  const isEditing = !!asset;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSchoolIds(asset?.school_ids || []);
    const schoolService = new SchoolService(createSupabaseClient());
    setLoadingSchools(true);
    schoolService.getAll(true)
      .then(setSchools)
      .catch(() => toast.error('Failed to load schools'))
      .finally(() => setLoadingSchools(false));
  }, [isOpen, asset?.id]);

  const initialValues: AssetFormValues = {
    name: asset?.name || '',
    description: asset?.description || '',
    is_active: asset ? (asset.is_active ? 'true' : 'false') : 'true',
  };

  const toggleSchool = (schoolId: string) => {
    setSelectedSchoolIds(prev =>
      prev.includes(schoolId) ? prev.filter(id => id !== schoolId) : [...prev, schoolId]
    );
  };

  const processFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('File type not supported');
      return;
    }
    const isVideo = file.type === 'video/mp4';
    const sizeLimit = isVideo ? MAX_SIZE : 20 * 1024 * 1024;
    if (file.size > sizeLimit) {
      toast.error(isVideo ? 'Video must be less than 200MB' : 'File must be less than 20MB');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl('');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (values: AssetFormValues) => {
    if (!isEditing && !selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setIsSubmitting(true);

      const assetData: Partial<AssetInterface> = {
        name: values.name,
        description: values.description || null,
        is_active: values.is_active === 'true',
        school_ids: selectedSchoolIds,
      };

      if (isEditing) {
        await assetService.updateWithFile(asset.id, assetData, selectedFile || undefined);
        toast.success('Asset updated successfully!');
      } else {
        await assetService.createWithFile(assetData, selectedFile!);
        toast.success('Asset uploaded successfully!');
      }

      onSuccess();
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    onClose();
  };

  const hasPreview = !!previewUrl;
  const isPdfSelected = selectedFile?.type === 'application/pdf';
  const isVideoSelected = selectedFile?.type === 'video/mp4';
  const existingIsPdf = asset?.file_type === 'application/pdf';
  const existingIsVideo = asset?.file_type === 'video/mp4';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Asset' : 'Upload New Asset'}</DialogTitle>
        </DialogHeader>

        <Formik<AssetFormValues>
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnBlur={false}
          enableReinitialize
        >
          {() => (
            <Form className="space-y-4">
              <FormikInputField name="name" label="Name" placeholder="e.g. School Poster 2025" />

              <FormikTextareaField
                name="description"
                label="Description"
                placeholder="Brief description of this file..."
                rows={3}
              />

              <FormikSelectField name="is_active" label="Status" placeholder="Select status">
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </FormikSelectField>

              {/* School targeting */}
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Restrict to Schools</p>
                  <p className="text-xs text-gray-500">Leave all unchecked to show to every school</p>
                </div>
                <SchoolCheckboxList
                  schools={schools}
                  selectedIds={selectedSchoolIds}
                  isLoading={loadingSchools}
                  onToggle={toggleSchool}
                  className="max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3 space-y-1"
                />
                {selectedSchoolIds.length > 0 && (
                  <p className="text-xs text-blue-600">
                    Restricted to {selectedSchoolIds.length} {selectedSchoolIds.length === 1 ? 'school' : 'schools'}
                  </p>
                )}
              </div>

              {/* File upload */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  {isEditing ? 'Replace File (optional)' : 'File'}
                </p>

                {(selectedFile || (isEditing && !selectedFile)) && (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    {hasPreview ? (
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                        <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                        <FileText size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {selectedFile ? selectedFile.name : asset?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedFile
                          ? isPdfSelected ? 'PDF' : isVideoSelected ? 'MP4 Video' : 'File'
                          : existingIsPdf ? 'PDF — current file' : existingIsVideo ? 'MP4 Video — current file' : 'Current file'}
                      </p>
                    </div>
                    {selectedFile && (
                      <Button type="button" variant="outline" size="sm" onClick={handleRemoveFile}>
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                )}

                <div
                  className={`rounded-lg border-2 border-dashed p-6 transition-colors ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <Upload className={`mx-auto mb-3 h-10 w-10 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {isEditing ? 'Drag & drop or choose a file to replace the current one' : 'Drag & drop or choose a file to upload'}
                      </p>
                      <div className="flex justify-center">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                            Choose File
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/rtf,text/rtf"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PDF, images, MP4, Word, PowerPoint, TXT, or RTF — images/docs up to 20MB, videos up to 200MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Upload'}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default AssetCreateEditDialog;
