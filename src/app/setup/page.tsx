"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { extractCfHandle, extractLcHandle } from "@/lib/utils/handles";

interface SetupRewards {
	xp: { amount: number; reason: string }[];
	badges: string[];
	totalXP: number;
}

export default function SetupPage() {
	const router = useRouter();
	const {
		user,
		hasProfile,
		loading: authLoading,
		refetchProfile,
	} = useAuthContext();
	const [displayName, setDisplayName] = useState("");
	const [cfHandle, setCfHandle] = useState("");
	const [lcHandle, setLcHandle] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	// Extract handles from URLs for preview
	const extractedCf = useMemo(() => extractCfHandle(cfHandle), [cfHandle]);
	const extractedLc = useMemo(() => extractLcHandle(lcHandle), [lcHandle]);
	const cfIsUrl = cfHandle.includes("codeforces.com");
	const lcIsUrl = lcHandle.includes("leetcode.com");

	const [rewards, setRewards] = useState<SetupRewards | null>(null);

	const displayNameId = useId();
	const cfHandleId = useId();
	const lcHandleId = useId();

	// If user already has a profile, redirect to dashboard
	useEffect(() => {
		if (!authLoading && hasProfile) {
			router.replace("/dashboard");
		}
	}, [authLoading, hasProfile, router]);

	// If not authenticated, redirect to login
	useEffect(() => {
		if (!authLoading && !user) {
			router.replace("/login");
		}
	}, [authLoading, user, router]);

	const handleSubmit = async () => {
		if (!displayName.trim()) {
			setErrors({ name: "Required" });
			return;
		}

		// Client-side: check that pasted URLs actually parse to a handle
		if (cfHandle.trim() && !extractedCf) {
			setErrors({ cf: "Could not extract handle from input" });
			return;
		}
		if (lcHandle.trim() && !extractedLc) {
			setErrors({ lc: "Could not extract handle from input" });
			return;
		}

		setLoading(true);
		setErrors({});

		if (!user) {
			setErrors({ name: "Session expired. Please log in again." });
			setLoading(false);
			return;
		}

		try {
			const res = await fetch("/api/auth/setup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					displayName: displayName.trim(),
					cfHandle: cfHandle.trim() || null,
					lcHandle: lcHandle.trim() || null,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				const errorField = data.field || "name";
				setErrors({ [errorField]: data.error || "Setup failed" });
				setLoading(false);
				return;
			}

			// Show the rewards screen before redirecting
			setRewards(data.rewards);

			// Refetch profile so AuthContext is aware
			await refetchProfile();
		} catch {
			setErrors({ name: "Network error. Try again." });
			setLoading(false);
		}
	};

	// Show loading while checking auth
	if (authLoading) {
		return (
			<div className="min-h-screen bg-void flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
					<p className="font-mono text-tiny text-text-muted uppercase tracking-widest">
						Loading...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-void flex items-center justify-center p-4 relative overflow-hidden">
			<div className="absolute inset-0 bg-grid-full opacity-20 pointer-events-none" />
			<div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[150px] pointer-events-none" />

			<AnimatePresence mode="wait">
				{rewards ? (
					/*  Rewards Celebration Screen  */
					<motion.div
						key="rewards"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
						className="w-full max-w-lg relative z-10"
					>
						<div className="card-brutal scifi-window p-0 overflow-hidden relative">
							<div className="absolute inset-0 bg-zinc-900/50 pointer-events-none" />

							{/* Corner decorations */}
							<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-cyan opacity-60 z-20" />
							<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-cyan opacity-60 z-20" />
							<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-cyan opacity-60 z-20" />
							<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-cyan opacity-60 z-20" />

							{/* Glow effect */}
							<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon-cyan/10 rounded-full blur-[80px] pointer-events-none" />

							{/* Header */}
							<div className="px-6 py-4 border-b border-neon-cyan/30 bg-zinc-950/80 backdrop-blur-md relative z-10">
								<div className="flex items-center gap-3">
									<div className="w-2.5 h-2.5 bg-neon-green rounded-none animate-pulse shadow-[0_0_8px_#39ff14]" />
									<p className="font-mono text-small text-neon-green uppercase tracking-widest font-black">
										NODE CONNECTED SUCCESSFULLY
									</p>
								</div>
							</div>

							<div className="p-8 md:p-10 space-y-8 relative z-10 text-center">
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{
										delay: 0.2,
										type: "spring",
										stiffness: 200,
										damping: 15,
									}}
									className="flex justify-center"
								>
									<div className="w-24 h-24 bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center relative">
										<div className="absolute inset-0 bg-neon-cyan/20 animate-pulse" />
										<span className="text-5xl relative z-10 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
											🎉
										</span>
									</div>
								</motion.div>

								<div className="space-y-2">
									<h2 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
										WELCOME TO <span className="text-neon-cyan">co.arc</span>
									</h2>
									<p className="text-text-secondary font-mono text-sm uppercase tracking-widest">
										Your node is now active
									</p>
								</div>

								{/* XP Awarded */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4 }}
									className="space-y-4"
								>
									<div className="bg-zinc-950 border border-neon-cyan/20 p-6 space-y-4">
										<p className="font-mono text-tiny text-neon-cyan uppercase tracking-widest font-black">
											:: REWARDS RECEIVED
										</p>

										{rewards.xp.map((xpItem, i) => (
											<motion.div
												key={xpItem.reason}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: 0.5 + i * 0.15 }}
												className="flex items-center justify-between py-2 border-b border-border-hard/30 last:border-0"
											>
												<span className="text-text-secondary font-mono text-sm">
													{xpItem.reason}
												</span>
												<span className="text-neon-cyan font-mono font-black text-lg tabular-nums">
													+{xpItem.amount} XP
												</span>
											</motion.div>
										))}

										<div className="flex items-center justify-between pt-3 border-t border-neon-cyan/20">
											<span className="text-text-primary font-mono text-sm font-black uppercase tracking-widest">
												Total
											</span>
											<motion.span
												initial={{ scale: 0.5, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												transition={{ delay: 0.8, type: "spring" }}
												className="text-neon-cyan font-mono font-black text-2xl tabular-nums"
											>
												+{rewards.totalXP} XP
											</motion.span>
										</div>
									</div>

									{/* Genesis Badge */}
									{rewards.badges.includes("genesis") && (
										<motion.div
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{
												delay: 1.0,
												type: "spring",
												stiffness: 150,
											}}
											className="bg-zinc-950 border-2 border-neon-green/30 p-6 relative overflow-hidden"
										>
											<div className="absolute inset-0 bg-neon-green/5 pointer-events-none" />
											<div className="absolute -top-4 -right-4 w-24 h-24 bg-neon-green/10 rounded-full blur-2xl pointer-events-none" />

											<div className="flex items-center gap-4 relative z-10">
												<div className="w-16 h-16 bg-zinc-900 border border-neon-green/30 flex items-center justify-center shrink-0">
													<motion.span
														animate={{ rotate: [0, 10, -10, 0] }}
														transition={{ delay: 1.2, duration: 0.5 }}
														className="text-4xl drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]"
													>
														🌱
													</motion.span>
												</div>
												<div className="text-left">
													<p className="text-neon-green font-mono text-sm font-black uppercase tracking-widest">
														GENESIS BADGE EARNED
													</p>
													<p className="text-text-secondary font-mono text-small mt-1">
														One of the first to join co.arc, forever on your
														profile
													</p>
												</div>
											</div>
										</motion.div>
									)}
								</motion.div>

								{/* CTA */}
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 1.2 }}
								>
									<button
										type="button"
										onClick={() => router.push("/dashboard")}
										className="btn-neon w-full py-5 text-sm tracking-[0.2em]"
									>
										ENTER THE ARC →
									</button>
								</motion.div>
							</div>
						</div>
					</motion.div>
				) : (
					/*  Setup Form  */
					<motion.div
						key="form"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						className="w-full max-w-xl relative z-10"
					>
						<div className="text-center mb-6 md:mb-10">
							<h1 className="font-heading text-3xl md:text-4xl font-black text-text-primary uppercase tracking-tighter text-center">
								PROFILE SETUP
							</h1>
							<p className="text-text-muted mt-3 font-mono text-small uppercase tracking-epic font-bold">
								CONFIGURING YOUR NODE
							</p>
						</div>

						<div className="card-brutal scifi-window p-0 overflow-hidden relative">
							<div className="absolute inset-0 bg-zinc-900/50 pointer-events-none" />

							<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-cyan opacity-40 z-20" />
							<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-cyan opacity-40 z-20" />
							<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-cyan opacity-40 z-20" />
							<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-cyan opacity-40 z-20" />

							<div className="px-6 py-4 border-b border-border-hard bg-zinc-950/80 backdrop-blur-md relative z-10">
								<div className="flex items-center gap-3">
									<div className="w-2.5 h-2.5 bg-neon-cyan rounded-none animate-pulse" />
									<p className="font-mono text-small text-neon-cyan uppercase tracking-widest font-black">
										SET UP YOUR PROFILE
									</p>
								</div>
							</div>

							<div className="p-6 md:p-10 space-y-6 md:space-y-8 relative z-10">
								<div className="space-y-4">
									<div className="flex justify-between items-baseline">
										<label
											htmlFor={displayNameId}
											className="text-text-muted font-mono text-small uppercase tracking-widest font-black"
										>
											DISPLAY_NAME
										</label>
										<span className="text-small font-mono text-neon-red/50 uppercase tracking-widest font-bold">
											* REQUIRED
										</span>
									</div>
									<div className="relative group">
										<input
											id={displayNameId}
											type="text"
											placeholder="e.g. Code_Master"
											value={displayName}
											onChange={(e) => setDisplayName(e.target.value)}
											className="w-full bg-zinc-950 border border-border-hard p-4 font-mono text-sm focus:border-neon-cyan focus:outline-none transition-colors group-hover:border-border-accent/40"
											autoFocus
										/>
										{errors.name && (
											<p className="text-neon-red text-small mt-2 font-mono uppercase font-black">
												{errors.name}
											</p>
										)}
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									<div className="space-y-4">
										<label
											htmlFor={cfHandleId}
											className="text-text-muted font-mono text-small uppercase tracking-widest font-black"
										>
											CF_HANDLE
										</label>
										<div className="relative group">
											<input
												id={cfHandleId}
												type="text"
												placeholder="tourist or profile URL"
												value={cfHandle}
												onChange={(e) => setCfHandle(e.target.value)}
												className="w-full bg-zinc-950 border border-border-hard p-4 font-mono text-sm focus:border-neon-cyan focus:outline-none transition-colors"
											/>
											{cfIsUrl && extractedCf && (
												<p className="text-neon-green text-small mt-2 font-mono uppercase font-black flex items-center gap-1.5">
													<span className="w-1.5 h-1.5 bg-neon-green rounded-full" />
													Detected: {extractedCf}
												</p>
											)}
											{cfIsUrl && !extractedCf && (
												<p className="text-neon-orange text-small mt-2 font-mono uppercase font-black">
													Could not extract handle from URL
												</p>
											)}
											{errors.cf && (
												<p className="text-neon-red text-small mt-2 font-mono uppercase font-black">
													{errors.cf}
												</p>
											)}
										</div>
									</div>

									<div className="space-y-4">
										<label
											htmlFor={lcHandleId}
											className="text-text-muted font-mono text-small uppercase tracking-widest font-black"
										>
											LC_HANDLE
										</label>
										<div className="relative group">
											<input
												id={lcHandleId}
												type="text"
												placeholder="neal_wu or profile URL"
												value={lcHandle}
												onChange={(e) => setLcHandle(e.target.value)}
												className="w-full bg-zinc-950 border border-border-hard p-4 font-mono text-sm focus:border-neon-cyan focus:outline-none transition-colors"
											/>
											{lcIsUrl && extractedLc && (
												<p className="text-neon-green text-small mt-2 font-mono uppercase font-black flex items-center gap-1.5">
													<span className="w-1.5 h-1.5 bg-neon-green rounded-full" />
													Detected: {extractedLc}
												</p>
											)}
											{lcIsUrl && !extractedLc && (
												<p className="text-neon-orange text-small mt-2 font-mono uppercase font-black">
													Could not extract handle from URL
												</p>
											)}
											{errors.lc && (
												<p className="text-neon-red text-small mt-2 font-mono uppercase font-black">
													{errors.lc}
												</p>
											)}
										</div>
									</div>
								</div>

								<div className="pt-4">
									<button
										type="button"
										onClick={handleSubmit}
										disabled={loading || !displayName.trim()}
										className="btn-neon w-full py-5 text-sm tracking-[0.2em] disabled:grayscale disabled:opacity-30"
									>
										{loading ? "SETTING UP..." : "COMPLETE SETUP →"}
									</button>
								</div>

								<div className="bg-zinc-950/50 p-4 border border-border-hard/30">
									<p className="text-text-muted text-small font-mono text-center uppercase tracking-widest leading-relaxed">
										Handles can be updated later in your dashboard.
									</p>
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
