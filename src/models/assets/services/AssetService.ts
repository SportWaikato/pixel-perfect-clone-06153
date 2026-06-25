import { SupabaseClient } from '@supabase/supabase-js';
import { AssetInterface } from '../interfaces/AssetInterface';
import { StorageService } from '@/models/storage/services/StorageService';

const ASSETS_TABLE = 'promotional_assets';

export class AssetService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getAll(): Promise<AssetInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(ASSETS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getActive(schoolId?: string): Promise<AssetInterface[]> {
    let query = this.supabaseClient
      .from(ASSETS_TABLE)
      .select('*')
      .eq('is_active', true);

    if (schoolId) {
      query = query.or(`school_ids.eq.{},school_ids.cs.{"${schoolId}"}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<AssetInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(ASSETS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async create(assetData: Partial<AssetInterface>): Promise<AssetInterface> {
    const { data, error } = await this.supabaseClient
      .from(ASSETS_TABLE)
      .insert({ ...assetData })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, assetData: Partial<AssetInterface>): Promise<AssetInterface> {
    const { data, error } = await this.supabaseClient
      .from(ASSETS_TABLE)
      .update({ ...assetData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(ASSETS_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async createWithFile(assetData: Partial<AssetInterface>, file: File): Promise<AssetInterface> {
    const storageService = new StorageService(this.supabaseClient);
    const { storage_url, storage_path } = await storageService.uploadAssetFile(file);

    return await this.create({
      ...assetData,
      file_url: storage_url,
      file_path: storage_path,
      file_type: file.type,
      file_size: file.size,
    });
  }

  async updateWithFile(
    id: string,
    assetData: Partial<AssetInterface>,
    file?: File
  ): Promise<AssetInterface> {
    let finalData = { ...assetData };

    if (file) {
      const current = await this.getById(id);
      const storageService = new StorageService(this.supabaseClient);
      const { storage_url, storage_path } = await storageService.updateAssetFile(
        current?.file_path || null,
        file
      );
      finalData = {
        ...finalData,
        file_url: storage_url,
        file_path: storage_path,
        file_type: file.type,
        file_size: file.size,
      };
    }

    return await this.update(id, finalData);
  }

  async deleteWithCleanup(id: string): Promise<void> {
    const asset = await this.getById(id);

    if (asset?.file_path) {
      try {
        const storageService = new StorageService(this.supabaseClient);
        await storageService.deleteAssetFile(asset.file_path);
      } catch (error) {
        console.warn('Failed to delete asset file from storage:', error);
      }
    }

    await this.delete(id);
  }
}
