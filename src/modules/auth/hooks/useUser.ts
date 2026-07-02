import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { UserService } from "@/models/users/services/UserService";
import { UserInterface } from "@/models/users/interfaces/UserInterface";

export const useUser = () => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createSupabaseClient();
        const userService = new UserService(supabase);
        const currentUser = await userService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const supabase = createSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "SIGNED_IN") {
        // Refetch user data
        getUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};
