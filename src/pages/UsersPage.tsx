import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Eye, KeyRound, Globe } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type ProfileWithRole = Tables<"profiles"> & { role?: string; domainCount?: number; plan?: string };

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<ProfileWithRole | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ProfileWithRole | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "viewer" as string, status: true });
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users-list"],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("*");
      const { data: subs } = await supabase.from("user_subscriptions").select("user_id, plan");
      const { data: websites } = await supabase.from("websites").select("user_id");
      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
      const planMap = new Map(subs?.map((s) => [s.user_id, s.plan]) ?? []);
      const domainMap = new Map<string, number>();
      websites?.forEach((w) => {
        if (w.user_id) domainMap.set(w.user_id, (domainMap.get(w.user_id) ?? 0) + 1);
      });
      return profiles.map((p) => ({
        ...p,
        role: roleMap.get(p.user_id),
        plan: planMap.get(p.user_id) ?? "free",
        domainCount: domainMap.get(p.user_id) ?? 0,
      })) as ProfileWithRole[];
    },
  });

  // User's domains for detail view
  const { data: userDomains } = useQuery({
    queryKey: ["user-domains", detailUser?.user_id],
    ...LIVE_QUERY_OPTIONS,
    enabled: !!detailUser,
    queryFn: async () => {
      const { data } = await supabase.from("websites").select("*").eq("user_id", detailUser!.user_id);
      return data ?? [];
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchesSearch = !search ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = filterPlan === "all" || u.plan === filterPlan;
      const matchesStatus = filterStatus === "all" || u.status === filterStatus;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, search, filterPlan, filterStatus]);

  const createUser = useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");
      await supabase.from("profiles").update({
        full_name: form.full_name,
        status: form.status ? "active" : "disabled",
      }).eq("user_id", authData.user.id);
      await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: form.role as "admin" | "manager" | "viewer",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      toast.success("User created");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateUser = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      await supabase.from("profiles").update({
        full_name: form.full_name,
        status: form.status ? "active" : "disabled",
      }).eq("user_id", editingUser.user_id);
      // Update role
      const { data: existingRole } = await supabase.from("user_roles").select("*").eq("user_id", editingUser.user_id).maybeSingle();
      if (existingRole) {
        await supabase.from("user_roles").update({ role: form.role as "admin" | "manager" | "viewer" }).eq("user_id", editingUser.user_id);
      } else {
        await supabase.from("user_roles").insert({ user_id: editingUser.user_id, role: form.role as "admin" | "manager" | "viewer" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      toast.success("User updated");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: string }) => {
      const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      toast.success("Status updated");
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      toast.success("User deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ full_name: "", email: "", password: "", role: "viewer", status: true });
    setEditingUser(null);
    setOpen(false);
  };

  const openEdit = (u: ProfileWithRole) => {
    setEditingUser(u);
    setForm({
      full_name: u.full_name,
      email: u.email,
      password: "",
      role: u.role ?? "viewer",
      status: u.status === "active",
    });
    setOpen(true);
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case "unlimited": return "default";
      case "professional": return "secondary";
      case "starter": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Manage system users, roles and access</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add User</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingUser ? "Edit User" : "Add User"}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingUser ? "Update user information and role" : "Create a new user account"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); editingUser ? updateUser.mutate() : createUser.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required className="bg-background border-border" />
              </div>
              {!editingUser && (
                <>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Password</Label>
                    <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} className="bg-background border-border" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.status} onCheckedChange={(v) => setForm((f) => ({ ...f, status: v }))} />
                <Label className="text-muted-foreground">{form.status ? "Active" : "Disabled"}</Label>
              </div>
              <Button type="submit" className="w-full" disabled={createUser.isPending || updateUser.isPending}>
                {(createUser.isPending || updateUser.isPending) ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-[150px] bg-background border-border">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free Trial</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="unlimited">Unlimited</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] bg-background border-border">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        {(search || filterPlan !== "all" || filterStatus !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterPlan("all"); setFilterStatus("all"); }} className="text-muted-foreground">
            Clear
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Domains</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>}
            {filteredUsers.length === 0 && !isLoading && <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>}
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {u.full_name?.[0]?.toUpperCase() ?? u.email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={planColor(u.plan ?? "free")} className="capitalize">{u.plan ?? "free"}</Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">
                    {u.role ?? "none"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-sm text-foreground">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" /> {u.domainCount}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleStatus.mutate({ userId: u.user_id, newStatus: u.status === "active" ? "disabled" : "active" })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors",
                      u.status === "active" ? "status-online" : "status-offline"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", u.status === "active" ? "bg-[hsl(var(--success))]" : "bg-destructive")} />
                    {u.status === "active" ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setDetailUser(u); setDetailOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteUser.mutate(u.user_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">User Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">Detailed user information and monitored domains</DialogDescription>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {detailUser.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{detailUser.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{detailUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium text-foreground capitalize">{detailUser.role ?? "none"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-medium text-foreground capitalize">{detailUser.plan ?? "free"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={cn("font-medium capitalize", detailUser.status === "active" ? "text-[hsl(var(--success))]" : "text-destructive")}>{detailUser.status}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Domains</p>
                  <p className="font-medium text-foreground">{detailUser.domainCount}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Monitored Domains</p>
                {userDomains?.length === 0 && <p className="text-sm text-muted-foreground">No domains</p>}
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {userDomains?.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2">
                      <span className={cn("h-2 w-2 rounded-full", d.status === "online" ? "bg-[hsl(var(--success))]" : d.status === "offline" ? "bg-destructive" : "bg-muted-foreground")} />
                      <span className="text-sm text-foreground flex-1 truncate">{d.name}</span>
                      <span className="text-xs text-muted-foreground">{d.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
