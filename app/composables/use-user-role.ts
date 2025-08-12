import type { Database } from "~~/types/database.types";

// Usage: const { data: userRole } = await useUserRole();

export function useUserRole() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useAsyncData(
    "user-role",
    async () => {
      if (!user.value) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.value.id)
        .single();

      if (error) throw error;
      return data?.role as
        | Database["public"]["Tables"]["profiles"]["Row"]["role"]
        | null;
    },
    {
      watch: [user],
      server: false,
    }
  );
}
