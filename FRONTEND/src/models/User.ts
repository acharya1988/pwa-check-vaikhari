export type AppRole = "user" | "editor" | "moderator" | "admin" | "superadmin";

export interface AppUser {
  _id: string; // Firebase UID
  email?: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  roles: AppRole[];
  status: "active" | "blocked";
  mfaEnrolled: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export function defaultNewUser(uid: string, partial: Partial<AppUser>): AppUser {
  const now = new Date();
  return {
    _id: uid,
    roles: ["user"],
    status: "active",
    mfaEnrolled: false,
    createdAt: now,
    lastLoginAt: now,
    ...partial,
  };
}

