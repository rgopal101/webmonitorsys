import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TABLE_QUERY_KEYS: Record<string, QueryKey[]> = {
  profiles: [["profiles-count"], ["users-list"], ["report-profiles"], ["admin-subscriptions"]],
  user_roles: [["users-list"]],
  user_subscriptions: [["admin-subscriptions"], ["subscriptions-stats"], ["report-subscriptions"], ["users-list"]],
  websites: [["websites"], ["websites-stats"], ["websites-list-filter"], ["report-websites"], ["users-list"], ["user-domains"]],
  activity_logs: [["activity-logs"], ["recent-logs"], ["report-logs"]],
};

export function useAdminRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = (keys: QueryKey[]) => {
      keys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    };

    const channel = supabase.channel("admin-live-sync");

    Object.entries(TABLE_QUERY_KEYS).forEach(([table, keys]) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        () => invalidate(keys)
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
