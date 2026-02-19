'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/gamification';
import { useAuth } from './useAuth';

export function useProfile() {
	const { user, loading: authLoading } = useAuth();
	const supabase = createClient();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchProfile = useCallback(async () => {
		if (!user) {
			setProfile(null);
			setLoading(false);
			return;
		}

		try {
			const { data, error } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', user.id)
				.single();

			if (error || !data) {
				setProfile(null);
			} else {
				setProfile(data as Profile);
			}
		} catch {
			setProfile(null);
		} finally {
			setLoading(false);
		}
	}, [user, supabase]);

	useEffect(() => {
		if (authLoading) return;
		fetchProfile();
	}, [authLoading, fetchProfile]);

	const refetch = useCallback(() => {
		setLoading(true);
		return fetchProfile();
	}, [fetchProfile]);

	return {
		profile,
		loading: authLoading || loading,
		isAdmin: profile?.is_admin ?? false,
		hasProfile: !!profile,
		refetch,
	};
}
