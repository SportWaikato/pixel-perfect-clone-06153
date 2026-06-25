'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { AchievementService } from '@/models/achievements/services/AchievementService';
import { AchievementInterface } from '@/models/achievements/interfaces/AchievementInterface';
import { BadgeImageHelper } from '@/models/achievements/helpers/BadgeImageHelper';

export interface BadgeImageSelection {
  storage_url?: string;
  storage_path?: string;
  is_custom_upload?: boolean;
  image_filename?: string;
}

interface BadgeImagePickerProps {
  selectedUrl: string;
  onSelect: (selection: BadgeImageSelection | null) => void;
}

const BadgeImagePicker = ({ selectedUrl, onSelect }: BadgeImagePickerProps) => {
  const [badges, setBadges] = useState<AchievementInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabaseClient = createSupabaseClient();
        const achievementService = new AchievementService(supabaseClient);
        const all = await achievementService.getAllAchievements();
        setBadges(all.filter(BadgeImageHelper.hasBadgeImage));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading badge library...
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No badge images in the library yet. Ask a Super Admin to upload some at{' '}
        <span className="font-medium">/admin/badges</span>.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
      {badges.map(badge => {
        const url = BadgeImageHelper.getBadgeImageUrl(badge);
        const isSelected = selectedUrl === url;
        return (
          <button
            key={badge.id}
            type="button"
            title={badge.name}
            onClick={() =>
              onSelect(
                isSelected
                  ? null
                  : {
                      storage_url: badge.storage_url,
                      storage_path: badge.storage_path,
                      is_custom_upload: badge.is_custom_upload,
                      image_filename: badge.image_filename,
                    }
              )
            }
            className={`relative flex aspect-square items-center justify-center rounded-lg border-2 p-1.5 transition-colors ${
              isSelected
                ? 'border-[#0B4B39] bg-emerald-50'
                : 'border-transparent bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className="relative h-full w-full">
              <Image src={url} alt={badge.name} fill sizes="80px" className="object-contain" />
            </div>
            {isSelected && (
              <CheckCircle2 className="absolute -right-1 -top-1 h-4 w-4 fill-white text-[#0B4B39]" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BadgeImagePicker;
