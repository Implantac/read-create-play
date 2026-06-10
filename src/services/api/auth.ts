import { supabase } from "@/integrations/supabase/client";

/**
 * Authentication API Service
 */
export const AuthApi = {
  async getSession() {
    return await supabase.auth.getSession();
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
