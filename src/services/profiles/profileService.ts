import { supabase } from "@/integrations/supabase/client";
import { Profile, UserWithRole } from "@/types/database";

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles (
          role
        )
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data as UserWithRole[];
  }
};
