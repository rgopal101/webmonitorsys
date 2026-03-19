import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSiteSettings(keys: string[]) {
  return useQuery({
    queryKey: ["site-settings", ...keys],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("setting_key", keys);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((row: any) => {
        map[row.setting_key] = row.setting_value;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogo() {
  const { data, isLoading } = useSiteSettings(["logo_url", "logo_alt_text"]);
  return {
    logoUrl: data?.logo_url || "",
    logoAlt: data?.logo_alt_text || "Isitonlineornot",
    logoLoading: isLoading,
  };
}
