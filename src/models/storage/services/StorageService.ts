import { SupabaseClient } from "@supabase/supabase-js";

export class StorageService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async uploadBadgeImage(file: File): Promise<{ storage_url: string; storage_path: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    return this.uploadBadgeBlob(fileName, file);
  }

  async uploadActivityProofImage(
    file: File,
  ): Promise<{ storage_url: string; storage_path: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `proofs/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `proofs/${fileName}`;

    const { error: uploadError } = await this.supabaseClient.storage
      .from("event-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = this.supabaseClient.storage.from("event-images").getPublicUrl(filePath);

    return { storage_url: publicUrl, storage_path: filePath };
  }

  async uploadBadgeImageFromBlob(
    blob: Blob,
    providedFilename?: string,
  ): Promise<{ storage_url: string; storage_path: string }> {
    const fallbackExt = blob.type === "image/png" ? "png" : "png";
    const fileName =
      providedFilename || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fallbackExt}`;
    return this.uploadBadgeBlob(fileName, blob);
  }

  private async uploadBadgeBlob(
    fileName: string,
    body: File | Blob,
  ): Promise<{ storage_url: string; storage_path: string }> {
    const filePath = `badges/${fileName}`;

    const { error: uploadError } = await this.supabaseClient.storage
      .from("badges")
      .upload(filePath, body, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = this.supabaseClient.storage.from("badges").getPublicUrl(filePath);

    return {
      storage_url: publicUrl,
      storage_path: filePath,
    };
  }

  async deleteBadgeImage(storage_path: string): Promise<void> {
    const { error } = await this.supabaseClient.storage.from("badges").remove([storage_path]);

    if (error) throw new Error(`Delete failed: ${error.message}`);
  }

  async updateBadgeImage(
    oldStoragePath: string | null,
    newFile: File,
  ): Promise<{ storage_url: string; storage_path: string }> {
    // Delete old image if it exists
    if (oldStoragePath) {
      try {
        await this.deleteBadgeImage(oldStoragePath);
      } catch (error) {
        console.warn("Failed to delete old badge image:", error);
      }
    }

    // Upload new image
    return await this.uploadBadgeImage(newFile);
  }

  async uploadAssetFile(file: File): Promise<{ storage_url: string; storage_path: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `assets/${fileName}`;

    const { error: uploadError } = await this.supabaseClient.storage
      .from("promotional-assets")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = this.supabaseClient.storage.from("promotional-assets").getPublicUrl(filePath);

    return {
      storage_url: publicUrl,
      storage_path: filePath,
    };
  }

  async uploadEventImage(file: File): Promise<{ storage_url: string; storage_path: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `events/${fileName}`;

    const { error: uploadError } = await this.supabaseClient.storage
      .from("event-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = this.supabaseClient.storage.from("event-images").getPublicUrl(filePath);

    return {
      storage_url: publicUrl,
      storage_path: filePath,
    };
  }

  async deleteEventImage(storage_path: string): Promise<void> {
    const { error } = await this.supabaseClient.storage.from("event-images").remove([storage_path]);

    if (error) throw new Error(`Delete failed: ${error.message}`);
  }

  async uploadUpdateImage(file: File): Promise<{ storage_url: string; storage_path: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `updates/${fileName}`;

    const { error: uploadError } = await this.supabaseClient.storage
      .from("school-updates")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = this.supabaseClient.storage.from("school-updates").getPublicUrl(filePath);

    return {
      storage_url: publicUrl,
      storage_path: filePath,
    };
  }

  async deleteUpdateImage(storage_path: string): Promise<void> {
    const { error } = await this.supabaseClient.storage
      .from("school-updates")
      .remove([storage_path]);

    if (error) throw new Error(`Delete failed: ${error.message}`);
  }

  async deleteAssetFile(storage_path: string): Promise<void> {
    const { error } = await this.supabaseClient.storage
      .from("promotional-assets")
      .remove([storage_path]);

    if (error) throw new Error(`Delete failed: ${error.message}`);
  }

  async updateAssetFile(
    oldStoragePath: string | null,
    newFile: File,
  ): Promise<{ storage_url: string; storage_path: string }> {
    if (oldStoragePath) {
      try {
        await this.deleteAssetFile(oldStoragePath);
      } catch (error) {
        console.warn("Failed to delete old asset file:", error);
      }
    }

    return await this.uploadAssetFile(newFile);
  }
}
