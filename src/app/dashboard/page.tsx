"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { getLevelForXP } from "@/lib/utils/constants";

interface LcStatsRow {
	easy_solved: number;
	medium_solved: number;
	hard_solved: number;
	total_solved: number;
	contest_rating: number | null;
	synced_at: string;
}

interface CfStatsRow {
	submission_count: number;
	latest_rating: number | null;
}

interface ActivityItem {
	id: string;
	platform: "cf" | "lc";
	title: string;
	subtitle: string;
	timestamp: string;
}

export default function DashboardPage() {
	const { profile, loading } = useAuthContext();
	const [syncing, setSyncing] = useState(false);
	const [syncMessage, setSyncMessage] = useState<string | null>(null);
	const [lcStats, setLcStats] = useState<LcStatsRow | null>(null);
	const [cfStats, setCfStats] = useState<CfStatsRow | null>(null);
	const [activity, setActivity] = useState<ActivityItem[]>([]);

	const supabase = useMemo(() => createClient(), []);

	const levelInfo = profile ? getLevelForXP(profile.xp) : null;
	const xpProgress = levelInfo?.xpForNext
		? Math.round((levelInfo.xpProgress / levelInfo.xpForNext) * 100)
		: 0;

	// Fetch platform stats + activity from DB
	const fetchPlatformStats = useCallback(async () => {
		if (!profile) return;

		const activityItems: ActivityItem[] = [];

		// Fetch LC stats
		if (profile.lc_handle) {
			const { data } = await supabase
				.from("lc_stats")
				.select(
					"easy_solved, medium_solved, hard_solved, total_solved, contest_rating, synced_at",
				)
				.eq("user_id", profile.id)
				.single();
			if (data) setLcStats(data);

			// Fetch recent LC submissions for activity log
			const { data: lcSubs } = await supabase
				.from("lc_submissions")
				.select("id, problem_title, problem_slug, difficulty, submitted_at")
				.eq("user_id", profile.id)
				.order("submitted_at", { ascending: false })
				.limit(100);

			if (lcSubs) {
				for (const s of lcSubs) {
					activityItems.push({
						id: `lc-${s.id}`,
						platform: "lc",
						title: s.problem_title,
						subtitle: s.difficulty,
						timestamp: s.submitted_at,
					});
				}
			}
		}

		// Fetch CF stats
		if (profile.cf_handle) {
			const { count } = await supabase
				.from("cf_submissions")
				.select("id", { count: "exact", head: true })
				.eq("user_id", profile.id);

			const { data: latestRating } = await supabase
				.from("cf_ratings")
				.select("new_rating")
				.eq("user_id", profile.id)
				.order("timestamp", { ascending: false })
				.limit(1)
				.single();

			setCfStats({
				submission_count: count ?? 0,
				latest_rating: latestRating?.new_rating ?? null,
			});

			// Fetch recent CF submissions for activity log
			const { data: cfSubs } = await supabase
				.from("cf_submissions")
				.select("id, problem_name, problem_rating, submitted_at")
				.eq("user_id", profile.id)
				.order("submitted_at", { ascending: false })
				.limit(100);

			if (cfSubs) {
				for (const s of cfSubs) {
					activityItems.push({
						id: `cf-${s.id}`,
						platform: "cf",
						title: s.problem_name,
						subtitle: s.problem_rating
							? `Rating ${s.problem_rating}`
							: "Unrated",
						timestamp: s.submitted_at,
					});
				}
			}
		}

		// Sort by timestamp descending
		activityItems.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		);

		// Deduplicate by problem title + platform (keep most recent)
		const seen = new Set<string>();
		const unique = activityItems.filter((item) => {
			const key = `${item.platform}:${item.title}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});

		setActivity(unique.slice(0, 50));
	}, [profile, supabase]);

	useEffect(() => {
		fetchPlatformStats();
	}, [fetchPlatformStats]);

	const handleSync = useCallback(async () => {
		setSyncing(true);
		setSyncMessage(null);
		try {
			const res = await fetch("/api/users/sync", { method: "POST" });
			const data = await res.json();
			if (res.ok && data.success) {
				// Build per-platform status message
				const parts: string[] = [];
				if (data.lc) {
					parts.push(data.lc.success ? "LC ✓" : `LC ✗ ${data.lc.error ?? ""}`);
				}
				if (data.cf) {
					parts.push(data.cf.success ? "CF ✓" : `CF ✗ ${data.cf.error ?? ""}`);
				}
				const allOk = (data.lc?.success ?? true) && (data.cf?.success ?? true);
				setSyncMessage(
					allOk ? "Sync complete!" : `Partial: ${parts.join(" | ")}`,
				);
				await fetchPlatformStats();
			} else {
				setSyncMessage(data.error || "Sync failed");
			}
		} catch {
			setSyncMessage("Network error");
		} finally {
			setSyncing(false);
			setTimeout(() => setSyncMessage(null), 6000);
		}
	}, [fetchPlatformStats]);

	const totalProblems = useMemo(() => {
		let total = 0;
		if (lcStats) total += lcStats.total_solved;
		if (cfStats) total += cfStats.submission_count;
		return total;
	}, [lcStats, cfStats]);

	const stats = useMemo(
		() => [
			{
				label: "XP_VAL",
				value: profile ? profile.xp.toLocaleString() : "0",
				icon: "⚡",
				color: "text-neon-cyan",
			},
			{
				label: "LVL_INDEX",
				value: levelInfo ? String(levelInfo.level).padStart(2, "0") : "01",
				icon: "📊",
				color: "text-text-primary",
			},
			{
				label: "STREAK_VAL",
				value: profile ? `${profile.current_streak}d` : "0d",
				icon: "🔥",
				color:
					profile && profile.current_streak > 0
						? "text-neon-orange"
						: "text-neon-red/80",
			},
			{
				label: "PROBLEMS",
				value: totalProblems > 0 ? totalProblems.toString() : "---",
				icon: "🏆",
				color: "text-neon-cyan",
			},
		],
		[profile, levelInfo, totalProblems],
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
					<p className="font-mono text-tiny text-text-muted uppercase tracking-widest">
						Loading dashboard...
					</p>
				</div>
			</div>
		);
	}

	const hasPlatforms = profile?.cf_handle || profile?.lc_handle;

	return (
		<div className="p-4 sm:p-8 pb-24 sm:pb-8 space-y-6 md:space-y-10 relative">
			{/* Ambient background accent */}
			<div className="absolute top-0 right-0 w-[400px] h-[400px] bg-neon-cyan/2 rounded-full blur-[120px] pointer-events-none" />

			{/* Header */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-neon-cyan pl-6"
			>
				<div>
					<h1 className="font-heading text-2xl md:text-4xl font-black text-text-primary uppercase tracking-tighter">
						{profile ? (
							<>
								Welcome,{" "}
								<span className="text-neon-cyan">{profile.display_name}</span>
							</>
						) : (
							"CONTROL_DASHBOARD"
						)}
					</h1>
					<p className="text-text-muted text-small font-mono mt-2 uppercase tracking-epic font-bold">
						{profile
							? `ROLL_${String(profile.roll_number).padStart(2, "0")} :: ${levelInfo?.title?.toUpperCase() ?? "NEWBIE"}`
							: "SYSTEM_STATUS :: CONNECTED"}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleSync}
						disabled={syncing}
						className="flex items-center gap-2 px-3 py-1.5 border border-border-hard bg-zinc-950 hover:border-neon-cyan/50 transition-colors font-mono text-tiny uppercase tracking-widest font-black disabled:opacity-30"
					>
						<span className={syncing ? "animate-spin" : ""}>⟳</span>
						{syncing ? "SYNCING..." : "SYNC"}
					</button>
					{syncMessage && (
						<span
							className={`font-mono text-tiny uppercase tracking-widest font-bold max-w-[300px] truncate ${
								syncMessage.includes("complete")
									? "text-neon-green"
									: syncMessage.includes("Partial")
										? "text-neon-orange"
										: "text-neon-red"
							}`}
							title={syncMessage}
						>
							{syncMessage}
						</span>
					)}
					<div className="w-2.5 h-2.5 bg-neon-green rounded-none animate-pulse" />
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-black">
						Online
					</span>
				</div>
			</motion.div>

			{/* XP Progress bar */}
			{levelInfo?.xpForNext && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.15 }}
				>
					<div className="flex justify-between text-tiny font-mono text-text-muted uppercase font-black mb-2 tracking-widest">
						<span>
							Level {levelInfo.level} → {levelInfo.level + 1}
						</span>
						<span>
							{levelInfo.xpProgress.toLocaleString()} /{" "}
							{levelInfo.xpForNext.toLocaleString()} XP
						</span>
					</div>
					<div className="h-2 w-full bg-void border border-border-hard p-[2px]">
						<motion.div
							className="h-full bg-neon-cyan shadow-[0_0_8px_#00f0ff]"
							initial={{ width: 0 }}
							animate={{ width: `${xpProgress}%` }}
							transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
						/>
					</div>
				</motion.div>
			)}

			{/* Quick stats */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
				{stats.map((stat, i) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
					>
						<Card className="h-full">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="text-text-muted text-tiny md:text-small font-mono uppercase tracking-widest font-black">
										{stat.label}
									</p>
									<p
										className={`text-2xl md:text-4xl font-mono font-black tracking-tighter ${stat.color}`}
									>
										{stat.value}
									</p>
								</div>
								<div className="w-10 h-10 rounded-none bg-void border border-border-hard flex items-center justify-center text-xl grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
									{stat.icon}
								</div>
							</div>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Platform Stats — always show both side-by-side when handles linked */}
			{hasPlatforms && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* LeetCode Card */}
						{profile?.lc_handle && (
							<Card title="LeetCode" glow>
								{lcStats ? (
									<div className="space-y-4">
										<div className="grid grid-cols-3 gap-3">
											<div className="text-center p-3 bg-zinc-950 border border-neon-green/20">
												<p className="text-neon-green font-mono text-2xl font-black">
													{lcStats.easy_solved}
												</p>
												<p className="text-text-muted font-mono text-tiny uppercase tracking-widest mt-1">
													Easy
												</p>
											</div>
											<div className="text-center p-3 bg-zinc-950 border border-neon-orange/20">
												<p className="text-neon-orange font-mono text-2xl font-black">
													{lcStats.medium_solved}
												</p>
												<p className="text-text-muted font-mono text-tiny uppercase tracking-widest mt-1">
													Medium
												</p>
											</div>
											<div className="text-center p-3 bg-zinc-950 border border-neon-red/20">
												<p className="text-neon-red font-mono text-2xl font-black">
													{lcStats.hard_solved}
												</p>
												<p className="text-text-muted font-mono text-tiny uppercase tracking-widest mt-1">
													Hard
												</p>
											</div>
										</div>
										<div className="flex items-center justify-between p-3 bg-zinc-950 border border-border-hard/50">
											<span className="text-text-muted font-mono text-small uppercase font-black">
												Total Solved
											</span>
											<span className="text-neon-cyan font-mono text-lg font-black">
												{lcStats.total_solved}
											</span>
										</div>
										{lcStats.contest_rating && (
											<div className="flex items-center justify-between p-3 bg-zinc-950 border border-border-hard/50">
												<span className="text-text-muted font-mono text-small uppercase font-black">
													Contest Rating
												</span>
												<span className="text-text-primary font-mono text-lg font-black">
													{Math.round(lcStats.contest_rating)}
												</span>
											</div>
										)}
										<p className="text-text-muted text-tiny font-mono uppercase tracking-widest">
											Synced:{" "}
											{new Date(lcStats.synced_at).toLocaleString("en-IN", {
												timeZone: "Asia/Kolkata",
											})}
										</p>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center py-8 space-y-3">
										<p className="text-text-muted font-mono text-small uppercase tracking-widest font-black">
											No data yet
										</p>
										<p className="text-text-secondary text-sm font-mono text-center">
											Hit SYNC to fetch your LeetCode stats for{" "}
											<span className="text-neon-cyan">
												{profile.lc_handle}
											</span>
										</p>
									</div>
								)}
							</Card>
						)}

						{/* Codeforces Card */}
						{profile?.cf_handle && (
							<Card title="Codeforces" glow>
								{cfStats &&
								(cfStats.latest_rating !== null ||
									cfStats.submission_count > 0) ? (
									<div className="space-y-4">
										<div className="flex items-center justify-between p-3 bg-zinc-950 border border-border-hard/50">
											<span className="text-text-muted font-mono text-small uppercase font-black">
												Rating
											</span>
											<span className="text-neon-cyan font-mono text-lg font-black">
												{cfStats.latest_rating ?? "Unrated"}
											</span>
										</div>
										<div className="flex items-center justify-between p-3 bg-zinc-950 border border-border-hard/50">
											<span className="text-text-muted font-mono text-small uppercase font-black">
												AC Submissions
											</span>
											<span className="text-text-primary font-mono text-lg font-black">
												{cfStats.submission_count}
											</span>
										</div>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center py-8 space-y-3">
										<p className="text-text-muted font-mono text-small uppercase tracking-widest font-black">
											No data yet
										</p>
										<p className="text-text-secondary text-sm font-mono text-center">
											Hit SYNC to fetch your Codeforces stats for{" "}
											<span className="text-neon-cyan">
												{profile.cf_handle}
											</span>
										</p>
									</div>
								)}
							</Card>
						)}
					</div>
				</motion.div>
			)}

			{/* Daily Problem section */}
			<motion.div
				initial={{ opacity: 0, scale: 0.98 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.4 }}
			>
				<Card
					title="Daily Problem"
					glow
					className="border-l-4 border-l-neon-cyan"
				>
					<div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
						<div className="flex-1 space-y-3">
							<div className="flex items-center gap-3">
								<div className="px-2 py-1 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-tiny font-black uppercase tracking-widest">
									Pending
								</div>
								<span className="text-text-muted font-mono text-small uppercase font-bold tracking-tighter">
									Status: Queued
								</span>
							</div>
							<h4 className="text-white font-mono text-lg md:text-xl font-black uppercase tracking-tight">
								Daily problem has not been set yet.
							</h4>
							<p className="text-text-secondary text-sm font-mono leading-relaxed">
								Check back later for today&apos;s challenge. The reset occurs
								every day at 08:00 IST.
							</p>
						</div>
						<div className="w-full md:w-auto">
							<div className="p-6 bg-zinc-950 border border-border-hard flex flex-col items-center justify-center gap-2 min-w-[200px]">
								<p className="text-text-muted font-mono text-tiny uppercase tracking-widest font-black">
									Reset_In
								</p>
								<p className="text-text-primary font-mono text-2xl font-black tabular-nums tracking-tighter">
									00:00:00
								</p>
							</div>
						</div>
					</div>
				</Card>
			</motion.div>

			{/* Main Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Activity Log */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="lg:col-span-2"
				>
					<Card title="Activity_Log" className="h-full">
						{activity.length > 0 ? (
							<div className="space-y-1 max-h-[400px] overflow-y-auto">
								{activity.map((item, i) => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.05 * i }}
										className="flex items-center gap-4 p-3 hover:bg-zinc-950/50 transition-colors border-b border-border-hard/20 last:border-0"
									>
										{/* Platform badge */}
										<div
											className={`shrink-0 w-8 h-8 flex items-center justify-center border font-mono text-tiny font-black uppercase ${
												item.platform === "lc"
													? "border-neon-orange/30 bg-neon-orange/5 text-neon-orange"
													: "border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan"
											}`}
										>
											{item.platform === "lc" ? "LC" : "CF"}
										</div>

										{/* Problem info */}
										<div className="flex-1 min-w-0">
											<p className="text-text-primary font-mono text-sm font-bold truncate">
												{item.title}
											</p>
											<p className="text-text-muted font-mono text-tiny uppercase tracking-widest">
												{item.subtitle}
											</p>
										</div>

										{/* Timestamp */}
										<span className="text-text-muted font-mono text-tiny tabular-nums shrink-0">
											{formatTimeAgo(item.timestamp)}
										</span>
									</motion.div>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
								<div className="w-16 h-16 rounded-none border border-border-hard flex items-center justify-center text-3xl opacity-20">
									📡
								</div>
								<div className="space-y-1">
									<p className="text-text-muted font-mono text-small uppercase tracking-widest font-black">
										LOG_DATA_EMPTY
									</p>
									<p className="text-text-secondary text-sm font-mono max-w-sm text-center">
										{hasPlatforms
											? "Hit SYNC to fetch your recent submissions."
											: "Link your CF or LC handle to see activity."}
									</p>
								</div>
							</div>
						)}
					</Card>
				</motion.div>

				{/* Side Panels */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="space-y-6"
				>
					<Card title="Weekly Quests">
						<div className="space-y-6">
							<div className="space-y-2">
								<div className="flex justify-between text-tiny font-mono text-text-muted uppercase font-black">
									<span>Progress</span>
									<span>0%</span>
								</div>
								<div className="h-1.5 w-full bg-void border border-border-hard p-px">
									<div className="h-full w-0 bg-neon-cyan shadow-[0_0_8px_#00f0ff]" />
								</div>
							</div>
							<p className="text-text-muted text-small font-mono leading-relaxed italic">
								Complete weekly challenges to earn more XP.
							</p>
						</div>
					</Card>

					{/* Quick links */}
					{profile && (!profile.cf_handle || !profile.lc_handle) && (
						<Card title="Quick Setup">
							<div className="space-y-3">
								{!profile.cf_handle && (
									<div className="flex items-center gap-3 p-3 bg-zinc-950 border border-neon-orange/20">
										<span className="text-sm">⚠️</span>
										<span className="text-tiny font-mono text-neon-orange uppercase tracking-widest font-bold">
											Link your CF handle
										</span>
									</div>
								)}
								{!profile.lc_handle && (
									<div className="flex items-center gap-3 p-3 bg-zinc-950 border border-neon-orange/20">
										<span className="text-sm">⚠️</span>
										<span className="text-tiny font-mono text-neon-orange uppercase tracking-widest font-bold">
											Link your LC handle
										</span>
									</div>
								)}
							</div>
						</Card>
					)}
				</motion.div>
			</div>
		</div>
	);
}

// Helpers

function formatTimeAgo(timestamp: string): string {
	const now = Date.now();
	const then = new Date(timestamp).getTime();
	const diffMs = now - then;
	const diffMins = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMs / 3_600_000);
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (diffMins < 1) return "now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 30) return `${diffDays}d ago`;
	return new Date(timestamp).toLocaleDateString("en-IN");
}
