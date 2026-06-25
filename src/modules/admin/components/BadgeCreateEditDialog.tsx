'use client';

import { useState } from 'react';
import { AchievementInterface } from '@/models/achievements/interfaces/AchievementInterface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/modules/application/components/DesignSystem/ui/dialog';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { AchievementService } from '@/models/achievements/services/AchievementService';
import { BadgeImageHelper } from '@/models/achievements/helpers/BadgeImageHelper';
import { Formik, Form } from 'formik';
import { FormikInputField, FormikSelectField, FormikTextareaField } from '@/modules/common/components/Formik';
import { SelectItem } from '@/modules/application/components/DesignSystem/ui/select';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import Image from 'next/image';
import BadgeCriteriaBuilder from '@/modules/admin/components/badges/BadgeCriteriaBuilder';
import {
  type BadgeFormValues,
  badgeFormValidationSchema,
  buildBadgeCriteriaFromValues,
  getInitialBadgeFormValues,
  parseBadgeNumberField,
} from '@/modules/admin/components/badges/badgeCriteriaHelpers';

interface BadgeCreateEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  badge: AchievementInterface | null;
}

const BadgeCreateEditDialog = ({ isOpen, onClose, onSuccess, badge }: BadgeCreateEditDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const achievementService = new AchievementService(createSupabaseClient());
  const isEditing = !!badge;

  const initialValues = getInitialBadgeFormValues(badge);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      if (file.size > maxSize) {
        toast.error('Image file must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = e => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (values: BadgeFormValues) => {
    try {
      setIsSubmitting(true);

      const pointsReward = parseBadgeNumberField(values.points_reward);
      if (typeof pointsReward === 'undefined') {
        toast.error('Points reward is invalid');
        return;
      }

      const criteria = buildBadgeCriteriaFromValues(values);

      const achievementData: Partial<AchievementInterface> = {
        name: values.name,
        description: values.description,
        icon_name: values.icon_name,
        points_reward: pointsReward,
        is_active: values.is_active === 'true',
        criteria,
      };

      if (isEditing) {
        await achievementService.updateWithImage(badge.id, achievementData, selectedFile || undefined);
        toast.success('Badge updated successfully!');
      } else {
        await achievementService.createWithImage(achievementData, selectedFile || undefined);
        toast.success('Badge created successfully!');
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

  const getCurrentImageUrl = () => {
    if (previewUrl) return previewUrl;
    if (badge && BadgeImageHelper.hasBadgeImage(badge)) {
      return BadgeImageHelper.getBadgeImageUrl(badge);
    }
    return '';
  };

  const hasCurrentImage = getCurrentImageUrl() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Badge' : 'Create New Badge'}
          </DialogTitle>
        </DialogHeader>

        <Formik<BadgeFormValues>
          initialValues={initialValues}
          validationSchema={badgeFormValidationSchema}
          onSubmit={handleSubmit}
          validateOnBlur={false}
        >
          {({ values, setFieldValue }) => (
            <Form className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormikInputField
                    name="name"
                    label="Badge Name"
                    placeholder="e.g. Nature Explorer"
                  />

                  <FormikInputField
                    name="icon_name"
                    label="Icon Name"
                    placeholder="e.g. award, trophy, star"
                  />
                </div>

                <FormikTextareaField
                  name="description"
                  label="Description"
                  placeholder="Describe what this badge represents..."
                  rows={3}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormikInputField
                    name="points_reward"
                    type="number"
                    label="Points Reward"
                    placeholder="10"
                  />

                  <FormikSelectField
                    name="is_active"
                    label="Status"
                    placeholder="Select status"
                  >
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </FormikSelectField>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Badge Image</h3>
                  {badge && BadgeImageHelper.isStorageBased(badge) && (
                    <Badge variant="secondary" className="text-xs">
                      <Upload size={12} className="mr-1" />
                      Custom Upload
                    </Badge>
                  )}
                  {badge && BadgeImageHelper.isLegacyBased(badge) && (
                    <Badge variant="outline" className="text-xs">
                      <ImageIcon size={12} className="mr-1" />
                      Legacy File
                    </Badge>
                  )}
                </div>

                {hasCurrentImage && (
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={getCurrentImageUrl()}
                        alt="Badge preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {selectedFile ? 'New Image Selected' : 'Current Badge Image'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedFile ? selectedFile.name : 'Existing badge image'}
                      </p>
                    </div>
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                )}

                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
                  <div className="text-center">
                    <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {hasCurrentImage ? 'Upload a new image to replace the current one' : 'Upload badge image'}
                      </p>
                      <div className="flex justify-center">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Choose File
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">JPEG, PNG, GIF, WebP up to 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Achievement Criteria</h3>
                </div>

                <BadgeCriteriaBuilder
                  values={values}
                  setFieldValue={setFieldValue}
                />
              </div>

              <div className="flex justify-end space-x-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeCreateEditDialog;
