import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Crown, RefreshCw, Ban, Loader2, Search, Pencil, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

const PLAN_PRICES: Record<string, number> = {
  free: 0, starter: 1, professional: 5, unlimited: 15,
};

const PLAN_LIMITS: Record<string, { domains: number; emails: number }> = {
  free: { domains: 1, emails: 1 },
  starter: { domains: 5, emails: 2 },
  professional: { domains: 10, emails: 5 },
  unlimited: { domains: 999, emails: 999 },
};

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [editSub, setEditSub] = useState<any>(null);
  const [editPlan, setEditPlan] = useState("");

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async () => {
      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: profiles } = await supabase.from("profiles").select("user_id, email, full_name");
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (subs ?? []).map((s) => ({
        ...s,
        email: profileMap.get(s.user_id)?.email ?? "Unknown",
        full_name: profileMap.get(s.user_id)?.full_name ?? "",
      }));
    },
  });

  const filtered = subscriptions?.filter((s) => {
    const matchSearch = !search ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.full_name.toLowerCase().includes(search.toLowerCase());
    const effectiveStatus = isExpired(s) ? "expired" : s.status;
    const matchStatus = filterStatus === "all" || effectiveStatus === filterStatus;
    const matchPlan = filterPlan === "all" || s.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ status: "suspended", max_domains: 0, max_emails: 0 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Subscription suspended");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ status: "active" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Subscription reactivated");
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: string }) => {
      const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          plan,
          max_domains: limits.domains,
          max_emails: limits.emails,
          status: "active",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Plan updated");
      setEditSub(null);
    },
  });

  const renewMutation = useMutation({
    mutationFn: async (sub: any) => {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 30);
      const limits = PLAN_LIMITS[sub.plan] ?? PLAN_LIMITS.free;
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          max_domains: limits.domains,
          max_emails: limits.emails,
        })
        .eq("id", sub.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Subscription renewed for 30 days");
    },
  });

  function isExpired(sub: any) {
    if (!sub.current_period_end) return false;
    return new Date(sub.current_period_end) < new Date();
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "trialing": return "secondary";
      case "suspended": return "destructive";
      case "expired": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" /> Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all user subscriptions, plans, and renewals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background border-border" />
        </div>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-[150px] bg-background border-border"><SelectValue placeholder="All Plans" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free Trial</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="unlimited">Unlimited</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] bg-background border-border"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Billing End</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No subscriptions found</TableCell></TableRow>
              )}
              {filtered?.map((sub) => {
                const expired = isExpired(sub);
                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <p className="font-medium">{sub.full_name || sub.email}</p>
                      <p className="text-xs text-muted-foreground">{sub.email}</p>
                    </TableCell>
                    <TableCell className="capitalize font-medium">{sub.plan}</TableCell>
                    <TableCell className="font-mono">${PLAN_PRICES[sub.plan] ?? 0}/mo</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(expired ? "expired" : sub.status)}>
                        {expired ? "Expired" : sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.max_domains === 999 ? "∞" : sub.max_domains}</TableCell>
                    <TableCell>{sub.max_emails === 999 ? "∞" : sub.max_emails}</TableCell>
                    <TableCell className="capitalize">{sub.payment_provider ?? "none"}</TableCell>
                    <TableCell className="text-sm">
                      {sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditSub(sub); setEditPlan(sub.plan); }}>
                          <ArrowUpDown className="mr-1 h-3 w-3" /> Change
                        </Button>
                        {(expired || sub.status === "suspended") && (
                          <Button size="sm" variant="outline" onClick={() => renewMutation.mutate(sub)}>
                            <RefreshCw className="mr-1 h-3 w-3" /> Renew
                          </Button>
                        )}
                        {sub.status !== "suspended" && !expired && (
                          <Button size="sm" variant="destructive" onClick={() => suspendMutation.mutate(sub.id)}>
                            <Ban className="mr-1 h-3 w-3" /> Suspend
                          </Button>
                        )}
                        {sub.status === "suspended" && (
                          <Button size="sm" variant="outline" onClick={() => reactivateMutation.mutate(sub.id)}>
                            <RefreshCw className="mr-1 h-3 w-3" /> Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={!!editSub} onOpenChange={(v) => { if (!v) setEditSub(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Change Plan</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upgrade or downgrade subscription for {editSub?.full_name || editSub?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current Plan</Label>
              <p className="font-medium text-foreground capitalize">{editSub?.plan}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">New Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Trial – $0</SelectItem>
                  <SelectItem value="starter">Starter – $1/mo (5 domains, 2 emails)</SelectItem>
                  <SelectItem value="professional">Professional – $5/mo (10 domains, 5 emails)</SelectItem>
                  <SelectItem value="unlimited">Unlimited – $15/mo (∞ domains, ∞ emails)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={changePlanMutation.isPending || editPlan === editSub?.plan}
              onClick={() => editSub && changePlanMutation.mutate({ id: editSub.id, plan: editPlan })}
            >
              {changePlanMutation.isPending ? "Updating..." : "Update Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
