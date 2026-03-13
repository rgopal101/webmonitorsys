import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

const PLAN_PRICES: Record<string, number> = {
  free: 0, starter: 1, professional: 5, unlimited: 15,
};

const COLORS = [
  "hsl(190, 90%, 50%)",
  "hsl(145, 65%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 55%)",
  "hsl(270, 60%, 55%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(220, 25%, 9%)",
  border: "1px solid hsl(220, 20%, 16%)",
  borderRadius: "8px",
  fontSize: 12,
  color: "hsl(220, 10%, 92%)",
};

export default function ReportsPage() {
  const { data: subscriptions } = useQuery({
    queryKey: ["report-subscriptions"],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async () => {
      const { data } = await supabase.from("user_subscriptions").select("*");
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["report-profiles"],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data ?? [];
    },
  });

  const { data: websites } = useQuery({
    queryKey: ["report-websites"],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async () => {
      const { data } = await supabase.from("websites").select("*");
      return data ?? [];
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["report-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  // Revenue by plan
  const revenueByPlan = Object.entries(
    (subscriptions ?? [])
      .filter((s) => s.status === "active")
      .reduce((acc, s) => {
        acc[s.plan] = (acc[s.plan] ?? 0) + (PLAN_PRICES[s.plan] ?? 0);
        return acc;
      }, {} as Record<string, number>)
  ).map(([plan, revenue]) => ({
    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
    revenue,
  }));

  // Plan distribution
  const planDist = Object.entries(
    (subscriptions ?? []).reduce((acc, s) => {
      acc[s.plan] = (acc[s.plan] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // User signups over last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const signupData = last30Days.map((day) => ({
    date: new Date(day).toLocaleDateString("en", { month: "short", day: "numeric" }),
    users: (profiles ?? []).filter((p) => p.created_at.startsWith(day)).length,
  }));

  // Domain status distribution
  const domainStatus = [
    { name: "Online", value: (websites ?? []).filter((w) => w.status === "online").length },
    { name: "Offline", value: (websites ?? []).filter((w) => w.status === "offline").length },
    { name: "Unknown", value: (websites ?? []).filter((w) => w.status !== "online" && w.status !== "offline").length },
  ].filter((d) => d.value > 0);

  // Downtime events over last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split("T")[0];
  });

  const downtimeData = last14Days.map((day) => ({
    date: new Date(day).toLocaleDateString("en", { weekday: "short", day: "numeric" }),
    events: (logs ?? []).filter((l) => l.event_type === "outage" && l.created_at.startsWith(day)).length,
  }));

  const totalRevenue = (subscriptions ?? [])
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Reports & Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue, growth, and system health metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground">Monthly Revenue</p>
          <p className="mt-1 text-2xl font-bold text-foreground">${totalRevenue}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{(profiles ?? []).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground">Domains Monitored</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{(websites ?? []).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground">Downtime Events</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {(logs ?? []).filter((l) => l.event_type === "outage").length}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Plan */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByPlan}>
                <XAxis dataKey="plan" tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill="hsl(190, 90%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                  {planDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {planDist.map((entry, i) => (
                <span key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User Signups (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={signupData}>
                <defs>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145, 65%, 42%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(145, 65%, 42%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="users" stroke="hsl(145, 65%, 42%)" fill="url(#colorSignups)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Downtime Events */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Downtime Events (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={downtimeData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="events" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Domain Status */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Domain Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={domainStatus} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} stroke="none">
                  <Cell fill="hsl(145, 65%, 42%)" />
                  <Cell fill="hsl(0, 72%, 55%)" />
                  <Cell fill="hsl(220, 10%, 50%)" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
