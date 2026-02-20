'use client';

import { Loader2, Search, Swords } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Profile {
	id: string;
	display_name: string;
	cf_handle: string | null;
}

interface ChallengeFormProps {
	users: Profile[];
	onChallenge: (userId: string, timeLimit: number) => Promise<{ ok: boolean; msg: string }>;
}

export function ChallengeForm({ users, onChallenge }: ChallengeFormProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
	const [timeLimit, setTimeLimit] = useState(60);
	const [challenging, setChallenging] = useState(false);
	const [challengeMsg, setChallengeMsg] = useState('');

	const filteredUsers = useMemo(() => {
		if (!searchQuery) return users.slice(0, 10);
		const q = searchQuery.toLowerCase();
		return users.filter(
			(u) => u.display_name.toLowerCase().includes(q) || u.cf_handle?.toLowerCase().includes(q),
		);
	}, [users, searchQuery]);

	async function sendChallenge() {
		if (!selectedUser) return;
		setChallenging(true);
		setChallengeMsg('');
		const result = await onChallenge(selectedUser.id, timeLimit);
		setChallengeMsg(result.msg);
		if (result.ok) {
			setSelectedUser(null);
			setSearchQuery('');
		}
		setChallenging(false);
	}

	return (
		<div className="card-brutal p-5 mb-6">
			<h3 className="dash-heading mb-3">
				<Swords className="w-4 h-4 text-neon-magenta opacity-50" /> Send Challenge
			</h3>

			<div className="flex flex-col sm:flex-row gap-3">
				{/* User search */}
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
					<input
						value={selectedUser ? selectedUser.display_name : searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setSelectedUser(null);
						}}
						placeholder="Search opponent..."
						className="form-input pl-10 py-2.5 text-sm"
					/>
					{searchQuery && !selectedUser && filteredUsers.length > 0 && (
						<div className="absolute top-full left-0 right-0 z-30 mt-1 border border-border-hard bg-surface max-h-48 overflow-y-auto">
							{filteredUsers.map((u) => (
								<button
									key={u.id}
									type="button"
									onClick={() => {
										setSelectedUser(u);
										setSearchQuery('');
									}}
									className="w-full text-left px-4 py-2.5 font-mono text-sm text-text-primary hover:bg-elevated transition-colors flex items-center gap-2"
								>
									<span>{u.display_name}</span>
									{u.cf_handle && <span className="text-text-dim text-tiny">@{u.cf_handle}</span>}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Time limit */}
				<select
					value={timeLimit}
					onChange={(e) => setTimeLimit(Number(e.target.value))}
					className="form-input py-2.5 text-sm sm:w-36"
				>
					<option value={15}>15 min</option>
					<option value={30}>30 min</option>
					<option value={60}>60 min</option>
				</select>

				{/* Send */}
				<button
					type="button"
					onClick={sendChallenge}
					disabled={!selectedUser || challenging}
					className="btn-neon px-5 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
					style={{ background: 'var(--color-neon-magenta)', borderColor: '#000' }}
				>
					{challenging ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Swords className="w-4 h-4" />
					)}
					Challenge
				</button>
			</div>

			{challengeMsg && <p className="font-mono text-sm text-text-secondary mt-2">{challengeMsg}</p>}
		</div>
	);
}
