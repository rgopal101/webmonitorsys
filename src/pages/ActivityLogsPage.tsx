import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const eventIcons: Record<string, string> = {
  recovery: "🟢",
  outage: "🔴",
  online: "🟢",
  offline: "🔴",
  monitoring_started: "▶️",
  monitoring_stopped: "⏸️",
  email_sent: "📧",
  high_response_time: "⚠️",
};

const eventColors: Record<string, string> = {
  recovery: "text-[hsl(var(--success))]",
  outage: "text-destructive",
  online: "text-[hsl(var(--success))]",
  offline: "text-destructive",
};

export default function ActivityLogsPage() {
  const [filterWebsite, setFilterWebsite] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const { data: websites } = useQuery({
    queryKey: ["websites-list-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("websites").select("id, name, status").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity-logs", filterWebsite, filterEvent, filterDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*, websites(name, url, status)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterWebsite !== "all") {
        query = query.eq("website_id", filterWebsite);
      }
      if (filterEvent !== "all") {
        query = query.eq("event_type", filterEvent);
      }
      if (filterDate) {
        const start = new Date(filterDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filterDate);
        end.setHours(23, 59, 59, 999);
        query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const clearFilters = () => {
    setFilterWebsite("all");
    setFilterEvent("all");
    setFilterDate(undefined);
  };

  const hasFilters = filterWebsite !== "all" || filterEvent !== "all" || filterDate !== undefined;

  // Build status filter options from websites
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "online", label: "🟢 Online" },
    { value: "offline", label: "🔴 Offline" },
  ];

  // Filter by website current status
  const filteredByStatus = filterWebsite === "all" ? logs : logs;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">System events and monitoring history</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterWebsite} onValueChange={setFilterWebsite}>
          <SelectTrigger className="w-[180px] bg-background border-border text-foreground">
            <SelectValue placeholder="All Websites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Websites</SelectItem>
            {websites?.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", w.status === "online" ? "bg-success" : w.status === "offline" ? "bg-destructive" : "bg-muted-foreground")} />
                  {w.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-[200px] bg-background border-border text-foreground">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="outage">🔴 Outage</SelectItem>
            <SelectItem value="recovery">🟢 Recovery</SelectItem>
            <SelectItem value="online">🟢 Online</SelectItem>
            <SelectItem value="offline">🔴 Offline</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal border-border text-foreground", !filterDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filterDate ? format(filterDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filterDate}
              onSelect={setFilterDate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
            Clear filters
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3">Event</th>
              <th className="px-6 py-3">Website</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Message</th>
              <th className="px-6 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>}
            {logs?.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">No activity logs found</td></tr>}
            {logs?.map((log) => {
              const website = (log as any).websites;
              return (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-sm">
                      <span>{eventIcons[log.event_type] ?? "📋"}</span>
                      <span className={cn("capitalize font-medium", eventColors[log.event_type] ?? "text-foreground")}>
                        {log.event_type.replace(/_/g, " ")}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {website?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    {website && (
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        website.status === "online" ? "status-online" : website.status === "offline" ? "status-offline" : "bg-muted text-muted-foreground"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", website.status === "online" ? "bg-success" : website.status === "offline" ? "bg-destructive" : "bg-muted-foreground")} />
                        {website.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{log.message}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
