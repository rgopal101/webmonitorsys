import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type ProfileWithRole = Tables<"profiles"> & { role?: string };

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ProfileWithRole | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "viewer" as string, status: true });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("*");
      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
      return profiles.map((p) => ({ ...p, role: roleMap.get(p.user_id) })) as ProfileWithRole[];
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Update profile
      await supabase.from("profiles").update({
        full_name: form.full_name,
        status: form.status ? "active" : "disabled",
      }).eq("user_id", authData.user.id);

      // Assign role
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add User</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingUser ? "Edit User" : "Add User"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createUser.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} className="bg-background border-border" />
              </div>
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
              <Button type="submit" className="w-full" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating..." : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>}
            {users?.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>}
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{u.full_name || "—"}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">
                    {u.role ?? "none"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    u.status === "active" ? "status-online" : "status-offline"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", u.status === "active" ? "bg-success" : "bg-destructive")} />
                    {u.status === "active" ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
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
    </div>
  );
}
