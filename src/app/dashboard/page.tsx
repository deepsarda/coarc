"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Bell, CircleDot, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActivityLog, {
	type ActivityItem,
} from "@/components/dashboard/ActivityLog";
import AttendanceCard from "@/components/dashboard/AttendanceCard";
import DailyProblemCard from "@/components/dashboard/DailyProblem";
import Heatmap from "@/components/dashboard/Heatmap";
import PlatformCards, {
	type CfStatsRow,
	type LcStatsRow,
} from "@/components/dashboard/PlatformCards";
import QuestsPanel, {
	type QuestItem,
} from "@/components/dashboard/QuestsPanel";
import SideInfo from "@/components/dashboard/SideInfo";
import StatsGrid from "@/components/dashboard/StatsGrid";
import TopicRadar from "@/components/dashboard/TopicRadar";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { getLevelForXP } from "@/lib/utils/constants";

/* Local Types */

interface DailyProblem {
	id: string;
	problem_name: string;
	problem_rating: number | null;
	problem_url: string;
	tags: string[];
	solved: boolean;
}

/* Page */

export default function DashboardPage() {
	const { profile, loading } = useAuthContext();
	const [syncing, setSyncing] = useState(false);
	const [syncMessage, setSyncMessage] = useState<string | null>(null);
	const [lcStats, setLcStats] = useState<LcStatsRow | null>(null);
	const [cfStats, setCfStats] = useState<CfStatsRow | null>(null);
	const [activity, setActivity] = useState<ActivityItem[]>([]);
	const [daily, setDaily] = useState<DailyProblem | null>(null);
	const [quests, setQuests] = useState<QuestItem[]>([]);
	const [notifCount, setNotifCount] = useState(0);
	const [badgeSummary, setBadgeSummary] = useState({ earned: 0, total: 0 });
	const [countdown, setCountdown] = useState("00:00:00");

	const supabase = useMemo(() => createClient(), []);
	const levelInfo = profile ? getLevelForXP(profile.xp) : null;
	const xpProgress = levelInfo?.xpForNext
		? Math.round((levelInfo.xpProgress / levelInfo.xpForNext) * 100)
		: 0;

	/* Data Fetching */

	const fetchPlatformStats = useCallback(async () => {
		if (!profile) return;
		const items: ActivityItem[] = [];

		if (profile.lc_handle) {
			const { data } = await supabase
				.from("lc_stats")
				.select(
					"easy_solved, medium_solved, hard_solved, total_solved, contest_rating, synced_at",
				)
				.eq("user_id", profile.id)
				.single();
			if (data) setLcStats(data);

			const { data: lcSubs } = await supabase
				.from("lc_submissions")
				.select("id, problem_title, problem_slug, difficulty, submitted_at")
				.eq("user_id", profile.id)
				.order("submitted_at", { ascending: false })
				.limit(50);

			if (lcSubs) {
				const unknownSlugs = lcSubs
					.filter((s) => !s.difficulty || s.difficulty === "Unknown")
					.map((s) => s.problem_slug);

				let diffMap = new Map<string, string>();
				if (unknownSlugs.length > 0) {
					const { data: probs } = await supabase
						.from("lc_problems")
						.select("slug, difficulty")
						.in("slug", [...new Set(unknownSlugs)]);
					if (probs)
						diffMap = new Map(probs.map((p) => [p.slug, p.difficulty]));
				}

				for (const s of lcSubs) {
					items.push({
						id: `lc-${s.id}`,
						platform: "lc",
						title: s.problem_title,
						subtitle:
							s.difficulty && s.difficulty !== "Unknown"
								? s.difficulty
								: (diffMap.get(s.problem_slug) ?? "Unknown"),
						timestamp: s.submitted_at,
					});
				}
			}
		}

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

			const { data: cfSubs } = await supabase
				.from("cf_submissions")
				.select("id, problem_name, problem_rating, submitted_at")
				.eq("user_id", profile.id)
				.order("submitted_at", { ascending: false })
				.limit(50);

			if (cfSubs) {
				for (const s of cfSubs) {
					items.push({
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

		items.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		);
		const seen = new Set<string>();
		setActivity(
			items.filter((item) => {
				const key = `${item.platform}:${item.title}`;
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			}),
		);
	}, [profile, supabase]);

	const fetchDailyProblem = useCallback(async () => {
		try {
			const res = await fetch("/api/problems/daily");
			if (!res.ok) return;
			const data = await res.json();
			if (data.daily) setDaily({ ...data.daily, solved: data.solved ?? false });
		} catch {
			/* silent */
		}
	}, []);

	const fetchQuests = useCallback(async () => {
		try {
			const res = await fetch("/api/quests/active");
			if (!res.ok) return;
			const data = await res.json();
			if (data.quests) {
				setQuests(
					data.quests.map((q: Record<string, unknown>) => ({
						id: q.id,
						title: q.title,
						description: q.description,
						xp_reward: q.xp_reward,
						progress: (q as Record<string, unknown>).user_progress ?? 0,
						target:
							(
								(q as Record<string, unknown>).condition as Record<
									string,
									number
								>
							)?.count ?? 1,
						completed: (q as Record<string, unknown>).user_completed ?? false,
					})),
				);
			}
		} catch {
			/* silent */
		}
	}, []);

	const fetchNotifCount = useCallback(async () => {
		try {
			const res = await fetch("/api/notifications/list?limit=1");
			if (!res.ok) return;
			const data = await res.json();
			setNotifCount(data.unread_count ?? 0);
		} catch {
			/* silent */
		}
	}, []);

	const fetchBadges = useCallback(async () => {
		try {
			const res = await fetch("/api/gamification/badges");
			if (!res.ok) return;
			const data = await res.json();
			const badges = data.badges ?? [];
			setBadgeSummary({
				total: badges.length,
				earned: badges.filter((b: { earned: boolean }) => b.earned).length,
			});
		} catch {
			/* silent */
		}
	}, []);

	useEffect(() => {
		fetchPlatformStats();
		fetchDailyProblem();
		fetchQuests();
		fetchNotifCount();
		fetchBadges();
	}, [
		fetchPlatformStats,
		fetchDailyProblem,
		fetchQuests,
		fetchNotifCount,
		fetchBadges,
	]);

	// Countdown to 08:00 IST (02:30 UTC)
	useEffect(() => {
		const tick = () => {
			const now = new Date();
			const tomorrow = new Date(now);
			tomorrow.setUTCHours(2, 30, 0, 0);
			if (tomorrow.getTime() <= now.getTime())
				tomorrow.setDate(tomorrow.getDate() + 1);
			const diff = tomorrow.getTime() - now.getTime();
			const h = Math.floor(diff / 3_600_000);
			const m = Math.floor((diff % 3_600_000) / 60_000);
			const s = Math.floor((diff % 60_000) / 1000);
			setCountdown(
				`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
			);
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, []);

	// Sync
	const handleSync = useCallback(async () => {
		setSyncing(true);
		setSyncMessage(null);
		try {
			const res = await fetch("/api/users/sync", { method: "POST" });
			const data = await res.json();
			if (res.ok && data.success) {
				const parts: string[] = [];
				if (data.lc)
					parts.push(data.lc.success ? "LC ✓" : `LC ✗ ${data.lc.error ?? ""}`);
				if (data.cf)
					parts.push(data.cf.success ? "CF ✓" : `CF ✗ ${data.cf.error ?? ""}`);
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

	// Computed
	const totalProblems = useMemo(() => {
		let total = 0;
		if (lcStats) total += lcStats.total_solved;
		if (cfStats) total += cfStats.submission_count;
		return total;
	}, [lcStats, cfStats]);

	const hasPlatforms = !!(profile?.cf_handle || profile?.lc_handle);

	/* Loading */

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

	/* Render */

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[1400px] mx-auto relative">
			{/* Background glow */}
			<div className="absolute top-0 right-0 w-[400px] h-[400px] bg-neon-cyan/2 rounded-full blur-[120px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-2 border-neon-cyan pl-6 mb-10"
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
					<p className="text-text-muted text-small font-mono mt-1 uppercase tracking-epic font-bold">
						{profile
							? `ROLL_${String(profile.roll_number).padStart(2, "0")} :: ${levelInfo?.title?.toUpperCase() ?? "NEWBIE"}`
							: "SYSTEM_STATUS :: CONNECTED"}
					</p>
				</div>
				<div className="flex items-center gap-2.5">
					<button
						type="button"
						onClick={handleSync}
						disabled={syncing}
						className="flex items-center gap-1.5 px-3 py-1.5 border border-border-hard bg-zinc-950 hover:border-neon-cyan/50 transition-colors font-mono text-tiny uppercase tracking-widest font-black disabled:opacity-30"
					>
						<RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
						{syncing ? "SYNCING..." : "SYNC"}
					</button>
					{syncMessage && (
						<span
							className={`font-mono text-tiny uppercase tracking-widest font-bold max-w-[250px] truncate ${
								syncMessage.includes("complete")
									? "text-emerald-400"
									: syncMessage.includes("Partial")
										? "text-amber-400"
										: "text-red-400"
							}`}
							title={syncMessage}
						>
							{syncMessage}
						</span>
					)}
					<Link
						href="/notifications"
						className="relative flex items-center justify-center w-8 h-8 border border-border-hard bg-zinc-950 hover:border-neon-cyan/50 transition-colors"
					>
						<Bell className="w-3.5 h-3.5 text-text-muted" />
						{notifCount > 0 && (
							<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] font-mono font-black text-white flex items-center justify-center">
								{notifCount > 9 ? "9+" : notifCount}
							</span>
						)}
					</Link>
					<div className="flex items-center gap-1.5">
						<CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
						<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-black">
							Online
						</span>
					</div>
				</div>
			</motion.header>

			{/* XP BAR */}
			{levelInfo?.xpForNext && (
				<motion.div
					initial={{ opacity: 0, scaleX: 0.8 }}
					animate={{ opacity: 1, scaleX: 1 }}
					transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
					className="mb-10 origin-left"
				>
					<div className="flex justify-between text-tiny font-mono text-text-muted uppercase font-black mb-1.5 tracking-widest">
						<span className="flex items-center gap-1">
							<Zap className="w-3 h-3 text-cyan-400" />
							Level {levelInfo.level} → {levelInfo.level + 1}
						</span>
						<span className="tabular-nums">
							{levelInfo.xpProgress.toLocaleString()} /{" "}
							{levelInfo.xpForNext.toLocaleString()} XP
						</span>
					</div>
					<div className="h-[6px] w-full bg-void border border-border-hard/30 p-px relative">
						<motion.div
							className="h-full bg-neon-cyan relative"
							initial={{ width: 0 }}
							animate={{ width: `${xpProgress}%` }}
							transition={{
								duration: 1.2,
								delay: 0.3,
								ease: [0.16, 1, 0.3, 1],
							}}
							style={{ boxShadow: "0 0 12px #00f0ff, 0 0 4px #00f0ff" }}
						>
							<div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#00f0ff,0_0_16px_#00f0ff]" />
						</motion.div>
					</div>
				</motion.div>
			)}

			{/* SECTIONS */}
			<div className="space-y-12">
				{/* STATS */}
				<StatsGrid
					profile={profile}
					levelInfo={levelInfo}
					totalProblems={totalProblems}
				/>

				{/* DAILY PROBLEM */}
				<DailyProblemCard daily={daily} countdown={countdown} />

				{/* HEATMAP */}
				{profile && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						<Heatmap userId={profile.id} />
					</motion.div>
				)}

				{/* SEPARATOR */}
				<div className="dash-divider" />

				{/* PLATFORMS */}
				<PlatformCards profile={profile} lcStats={lcStats} cfStats={cfStats} />

				{/* ACTIVITY LOG (full width, scrollable) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
				>
					<ActivityLog activity={activity} hasPlatforms={hasPlatforms} />
				</motion.div>

				{/* SEPARATOR */}
				<div className="dash-divider" />

				{/* LOWER SECTION: Topic Radar + Side Info (2 col) */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-10">
					{/* Left: Topic Radar + Quests */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
						className="space-y-10"
					>
						{profile && <TopicRadar userId={profile.id} />}
						<QuestsPanel quests={quests} />
					</motion.div>

					{/* Right: Streak/Badges + Attendance */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
						className="space-y-10"
					>
						{profile && (
							<SideInfo
								profile={profile}
								badgesEarned={badgeSummary.earned}
								badgesTotal={badgeSummary.total}
							/>
						)}
						<AttendanceCard />
					</motion.div>
				</div>

				{/* SETUP PROMPT */}
				{profile && (!profile.cf_handle || !profile.lc_handle) && (
					<div className="flex items-center gap-3 px-4 py-3 border-l-2 border-l-amber-400/40">
						<AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
						<span className="text-tiny font-mono text-amber-400/80 uppercase tracking-widest font-bold">
							{!profile.cf_handle && !profile.lc_handle
								? "Link your Codeforces & LeetCode handles in Settings"
								: !profile.cf_handle
									? "Link your Codeforces handle in Settings"
									: "Link your LeetCode handle in Settings"}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
