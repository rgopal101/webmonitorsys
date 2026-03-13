import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function ActivityLogsPage() {
  const [filterWebsite, setFilterWebsite] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<"created_at" | "event_type" | "website">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: websites } = useQuery({
    queryKey: ["websites-list-filter"],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase.from("websites").select("id, name, status").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity-logs", filterWebsite, filterEvent, filterDate?.toISOString()],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*, websites(name, url, status)")
        .order("created_at", { ascending: false })
        .limit(1000);

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

  // Client-side search + sort
  const processedLogs = useMemo(() => {
    let result = logs ?? [];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((log) => {
        const website = (log as any).websites;
        return (
          log.message.toLowerCase().includes(q) ||
          log.event_type.toLowerCase().includes(q) ||
          (website?.name ?? "").toLowerCase().includes(q)
        );
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "event_type") {
        cmp = a.event_type.localeCompare(b.event_type);
      } else if (sortField === "website") {
        const nameA = ((a as any).websites?.name ?? "").toLowerCase();
        const nameB = ((b as any).websites?.name ?? "").toLowerCase();
        cmp = nameA.localeCompare(nameB);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [logs, searchQuery, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processedLogs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLogs = processedLogs.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );
  const startRow = processedLogs.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRow = Math.min(safeCurrentPage * pageSize, processedLogs.length);

  const clearFilters = () => {
    setFilterWebsite("all");
    setFilterEvent("all");
    setFilterDate(undefined);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasFilters = filterWebsite !== "all" || filterEvent !== "all" || filterDate !== undefined || searchQuery.trim() !== "";

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const SortIndicator = ({ field }: { field: typeof sortField }) => (
    <span className="ml-1 text-[10px] opacity-60">
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  // Reset page when filters change
  const handleFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">System events and monitoring history</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery)(e.target.value)}
            className="pl-9 w-[220px] bg-background border-border text-foreground"
          />
        </div>

        <Select value={filterWebsite} onValueChange={handleFilterChange(setFilterWebsite)}>
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

        <Select value={filterEvent} onValueChange={handleFilterChange(setFilterEvent)}>
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
              onSelect={handleFilterChange(setFilterDate)}
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

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("event_type")}>
                Event <SortIndicator field="event_type" />
              </th>
              <th className="px-6 py-3 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("website")}>
                Website <SortIndicator field="website" />
              </th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Message</th>
              <th className="px-6 py-3 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("created_at")}>
                Time <SortIndicator field="created_at" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>}
            {!isLoading && paginatedLogs.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">No activity logs found</td></tr>
            )}
            {paginatedLogs.map((log) => {
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
                  <td className="px-6 py-4 text-sm text-foreground max-w-[400px] truncate" title={log.message}>{log.message}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Rows per page:</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="h-8 w-[70px] bg-background border-border text-foreground text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs">
              {startRow}–{endRow} of {processedLogs.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(1)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            {(() => {
              const pages: number[] = [];
              const maxVisible = 5;
              let startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
              const endPage = Math.min(totalPages, startPage + maxVisible - 1);
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }
              for (let i = startPage; i <= endPage; i++) pages.push(i);
              return pages.map((p) => (
                <Button
                  key={p}
                  variant={p === safeCurrentPage ? "default" : "ghost"}
                  size="icon"
                  className={cn("h-8 w-8 text-xs", p === safeCurrentPage && "pointer-events-none")}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </Button>
              ));
            })()}

            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
