"use client";

import { useAuthContext } from "@/components/providers/AuthProvider";

/**
 * Convenience hook that re-exports key values from AuthContext.
 * Prefer useAuthContext() directly for full access (profile, isAdmin, etc).
 */
export function useAuth() {
	const { session, user, loading, signOut } = useAuthContext();
	return { session, user, loading, signOut };
}
