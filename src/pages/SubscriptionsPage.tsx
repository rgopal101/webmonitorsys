import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Crown, RefreshCw, Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch profiles for emails
      const { data: profiles } = await supabase.from("profiles").select("user_id, email, full_name");
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

      return (subs ?? []).map((s) => ({
        ...s,
        email: profileMap.get(s.user_id)?.email ?? "Unknown",
        full_name: profileMap.get(s.user_id)?.full_name ?? "",
      }));
    },
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

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "trialing": return "secondary";
      case "suspended": return "destructive";
      case "expired": return "destructive";
      default: return "secondary";
    }
  };

  const isExpired = (sub: any) => {
    if (!sub.current_period_end) return false;
    return new Date(sub.current_period_end) < new Date();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" /> Subscriptions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all user subscriptions, auto-expiry, and renewals.</p>
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
                <TableHead>Status</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <p className="font-medium">{sub.full_name || sub.email}</p>
                    <p className="text-xs text-muted-foreground">{sub.email}</p>
                  </TableCell>
                  <TableCell className="capitalize font-medium">{sub.plan}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(isExpired(sub) ? "expired" : sub.status)}>
                      {isExpired(sub) ? "Expired" : sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{sub.max_domains === 999 ? "∞" : sub.max_domains}</TableCell>
                  <TableCell className="capitalize">{(sub as any).payment_provider ?? "none"}</TableCell>
                  <TableCell className="text-sm">
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {sub.status === "suspended" ? (
                        <Button size="sm" variant="outline" onClick={() => reactivateMutation.mutate(sub.id)}>
                          <RefreshCw className="mr-1 h-3 w-3" /> Reactivate
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => suspendMutation.mutate(sub.id)}>
                          <Ban className="mr-1 h-3 w-3" /> Suspend
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
