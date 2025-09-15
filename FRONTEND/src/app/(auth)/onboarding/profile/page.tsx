'use client';

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { completeUserProfile, reserveHandle, AppRole } from "@/services/user.service";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const roles: AppRole[] = ["Researcher", "Doctor", "Student", "Enthusiast"];

export default function ProfileOnboardingPage() {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<AppRole>("Researcher");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser) router.replace("/login");
  }, [router]);

  async function save() {
    const u = auth.currentUser;
    if (!u) return;
    setBusy(true);
    try {
      const ok = await reserveHandle(u.uid, handle);
      if (!ok) {
        toast({ variant: "destructive", title: "Handle taken", description: "Choose another @handle." });
        setBusy(false);
        return;
      }
      await completeUserProfile(u.email!, { name, handle, role });
      router.push("/admin/activity");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to save", description: e?.message ?? "Unknown error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md space-y-3">
        <h1 className="text-xl font-semibold text-center">Complete your profile</h1>
        <Input placeholder="Full name" value={name} onChange={(e)=>setName(e.target.value)} />
        <Input placeholder="@handle" value={handle} onChange={(e)=>setHandle(e.target.value)} />
        <Select value={role} onValueChange={(v)=>setRole(v as AppRole)}>
          <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={save} disabled={busy || !name || !handle}>
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
