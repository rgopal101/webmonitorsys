import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Globe, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: profiles } = useQuery({
    queryKey: ["profiles-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: websites } = useQuery({
    queryKey: ["websites-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("websites").select("*");
      return data ?? [];
    },
  });

  const totalWebsites = websites?.length ?? 0;
  const activeMonitoring = websites?.filter((w) => w.tracking_enabled).length ?? 0;
  const offlineWebsites = websites?.filter((w) => w.status === "offline").length ?? 0;

  const stats = [
    { label: "Total Users", value: profiles ?? 0, icon: Users, color: "text-primary" },
    { label: "Total Websites", value: totalWebsites, icon: Globe, color: "text-primary" },
    { label: "Active Monitoring", value: activeMonitoring, icon: Activity, color: "text-success" },
    { label: "Websites Offline", value: offlineWebsites, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your monitoring system</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Live monitoring table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Live Monitoring</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Website</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Response Time</th>
                <th className="px-6 py-3">Last Checked</th>
                <th className="px-6 py-3">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {websites?.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">No websites added yet</td></tr>
              )}
              {websites?.map((w) => (
                <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.url}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      w.status === "online" ? "status-online" : w.status === "offline" ? "status-offline" : "bg-muted text-muted-foreground"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", w.status === "online" ? "bg-success" : w.status === "offline" ? "bg-destructive" : "bg-muted-foreground")} />
                      {w.status === "online" ? "Online" : w.status === "offline" ? "Offline" : "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-mono">
                    {w.response_time_ms ? `${w.response_time_ms}ms` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {w.last_checked_at ? new Date(w.last_checked_at).toLocaleString() : "Never"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      w.tracking_enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {w.tracking_enabled ? "ON" : "OFF"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
