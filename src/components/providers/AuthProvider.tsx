"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/gamification";

interface AuthContextValue {
	session: Session | null;
	user: User | null;
	profile: Profile | null;
	loading: boolean;
	isAdmin: boolean;
	hasProfile: boolean;
	signOut: () => Promise<void>;
	refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
	session: null,
	user: null,
	profile: null,
	loading: true,
	isAdmin: false,
	hasProfile: false,
	signOut: async () => {},
	refetchProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const supabase = useMemo(() => createClient(), []);
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchProfile = useCallback(
		async (userId: string) => {
			try {
				const { data } = await supabase
					.from("profiles")
					.select("*")
					.eq("id", userId)
					.single();

				setProfile((data as Profile) ?? null);
			} catch {
				setProfile(null);
			}
		},
		[supabase],
	);

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session: s } }) => {
			setSession(s);
			setUser(s?.user ?? null);
			if (s?.user) {
				fetchProfile(s.user.id).then(() => setLoading(false));
			} else {
				setLoading(false);
			}
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, s) => {
			setSession(s);
			setUser(s?.user ?? null);
			if (s?.user) {
				fetchProfile(s.user.id).then(() => setLoading(false));
			} else {
				setProfile(null);
				setLoading(false);
			}
		});

		return () => subscription.unsubscribe();
	}, [supabase, fetchProfile]);

	const signOut = useCallback(async () => {
		await supabase.auth.signOut();
		setProfile(null);
		window.location.href = "/";
	}, [supabase]);

	const refetchProfile = useCallback(async () => {
		if (user) {
			await fetchProfile(user.id);
		}
	}, [user, fetchProfile]);

	const value = useMemo<AuthContextValue>(
		() => ({
			session,
			user,
			profile,
			loading,
			isAdmin: profile?.is_admin ?? false,
			hasProfile: !!profile,
			signOut,
			refetchProfile,
		}),
		[session, user, profile, loading, signOut, refetchProfile],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuthContext must be used within AuthProvider");
	}
	return ctx;
}
