import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const eventIcons: Record<string, string> = {
  online: "🟢",
  offline: "🔴",
  monitoring_started: "▶️",
  monitoring_stopped: "⏸️",
  email_sent: "📧",
  high_response_time: "⚠️",
};

export default function ActivityLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*, websites(name, url)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">System events and monitoring history</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3">Event</th>
              <th className="px-6 py-3">Website</th>
              <th className="px-6 py-3">Message</th>
              <th className="px-6 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>}
            {logs?.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">No activity logs yet</td></tr>}
            {logs?.map((log) => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2 text-sm">
                    <span>{eventIcons[log.event_type] ?? "📋"}</span>
                    <span className="capitalize text-foreground font-medium">{log.event_type.replace(/_/g, " ")}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {(log as any).websites?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{log.message}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
