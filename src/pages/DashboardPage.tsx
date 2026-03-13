import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import {
  Users, Globe, Activity, AlertTriangle, Crown, DollarSign,
  TrendingUp, ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const PLAN_PRICES: Record<string, number> = {
  starter: 1,
  professional: 5,
  unlimited: 15,
  free: 0,
};

const PIE_COLORS = [
  "hsl(190, 90%, 50%)",
  "hsl(145, 65%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 55%)",
];

export default function DashboardPage() {
  const { data: profiles } = useQuery({
    queryKey: ["profiles-count"],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data ?? [];
    },
  });

  const { data: websites } = useQuery({
    queryKey: ["websites-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("websites").select("*");
      return data ?? [];
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["subscriptions-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("user_subscriptions").select("*");
      return data ?? [];
    },
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["recent-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*, websites(name)")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const totalUsers = profiles?.length ?? 0;
  const totalWebsites = websites?.length ?? 0;
  const offlineWebsites = websites?.filter((w) => w.status === "offline").length ?? 0;
  const activeSubs = subscriptions?.filter((s) => s.status === "active" || s.status === "trialing").length ?? 0;
  const expiredSubs = subscriptions?.filter((s) => {
    if (!s.current_period_end) return false;
    return new Date(s.current_period_end) < new Date() || s.status === "suspended";
  }).length ?? 0;

  const monthlyRevenue = subscriptions
    ?.filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0) ?? 0;

  // Plan distribution for pie chart
  const planCounts = subscriptions?.reduce((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  const pieData = Object.entries(planCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Fake trend data based on subscriptions created_at
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const signupTrend = last7Days.map((day) => ({
    date: new Date(day).toLocaleDateString("en", { weekday: "short" }),
    users: profiles?.filter((p) => p.created_at.startsWith(day)).length ?? 0,
  }));

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-primary", trend: "+12%" },
    { label: "Active Subscriptions", value: activeSubs, icon: Crown, color: "text-[hsl(var(--success))]", trend: "+5%" },
    { label: "Expired / Suspended", value: expiredSubs, icon: AlertTriangle, color: "text-destructive", trend: null },
    { label: "Monitored Domains", value: totalWebsites, icon: Globe, color: "text-primary", trend: "+8%" },
    { label: "Domains Down", value: offlineWebsites, icon: Activity, color: "text-destructive", trend: null },
    { label: "Monthly Revenue", value: `$${monthlyRevenue}`, icon: DollarSign, color: "text-[hsl(var(--success))]", trend: "+15%" },
  ];

  const eventIcons: Record<string, string> = {
    recovery: "🟢", outage: "🔴", online: "🟢", offline: "🔴",
    monitoring_started: "▶️", monitoring_stopped: "⏸️", email_sent: "📧",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">System overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
            {s.trend && (
              <p className="mt-1 flex items-center gap-1 text-xs text-[hsl(var(--success))]">
                <TrendingUp className="h-3 w-3" /> {s.trend}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Signup Trend */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User Signups (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={signupTrend}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 25%, 9%)",
                    border: "1px solid hsl(220, 20%, 16%)",
                    borderRadius: "8px",
                    fontSize: 12,
                    color: "hsl(220, 10%, 92%)",
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="hsl(190, 90%, 50%)" fill="url(#colorUsers)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 25%, 9%)",
                    border: "1px solid hsl(220, 20%, 16%)",
                    borderRadius: "8px",
                    fontSize: 12,
                    color: "hsl(220, 10%, 92%)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {pieData.map((entry, i) => (
                <span key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Activity + Live Monitoring */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentLogs?.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            )}
            {recentLogs?.map((log) => (
              <div key={log.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors">
                <span className="text-base">{eventIcons[log.event_type] ?? "📋"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{log.message}</p>
                  <p className="text-xs text-muted-foreground">{(log as any).websites?.name ?? "System"}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live Monitoring Summary */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Live Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {websites?.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No websites added yet</p>
              )}
              {websites?.slice(0, 10).map((w) => (
                <div key={w.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors">
                  <span className={cn(
                    "h-2 w-2 rounded-full flex-shrink-0",
                    w.status === "online" ? "bg-[hsl(var(--success))]" : w.status === "offline" ? "bg-destructive" : "bg-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{w.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{w.url}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono text-foreground">{w.response_time_ms ? `${w.response_time_ms}ms` : "—"}</p>
                    <p className={cn(
                      "text-xs font-medium",
                      w.status === "online" ? "text-[hsl(var(--success))]" : w.status === "offline" ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {w.status ?? "unknown"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
