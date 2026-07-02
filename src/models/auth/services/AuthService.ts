import { SupabaseClient } from "@supabase/supabase-js";

export class AuthService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabaseClient.auth.signOut();
    if (error) throw error;
  }

  async resetPasswordForEmail(email: string, redirectTo?: string) {
    const { data, error } = await this.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) throw error;
    return data;
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  }

  async getSession() {
    const { data, error } = await this.supabaseClient.auth.getSession();
    if (error) throw error;
    return data;
  }

  async getUser() {
    const { data, error } = await this.supabaseClient.auth.getUser();
    if (error) throw error;
    return data.user;
  }
}
