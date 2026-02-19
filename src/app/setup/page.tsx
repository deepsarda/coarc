"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ROLL } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

export default function SetupPage() {
	const router = useRouter();
	const supabase = createClient();
	const [displayName, setDisplayName] = useState("");
	const [cfHandle, setCfHandle] = useState("");
	const [lcHandle, setLcHandle] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [validating, setValidating] = useState<Record<string, boolean>>({});

	const displayNameId = useId();
	const cfHandleId = useId();
	const lcHandleId = useId();

	const validateCfHandle = async (handle: string): Promise<boolean> => {
		if (!handle) return true;
		setValidating((v) => ({ ...v, cf: true }));
		try {
			const res = await fetch(
				`https://codeforces.com/api/user.info?handles=${handle}`,
			);
			const data = await res.json();
			if (data.status !== "OK") {
				setErrors((e) => ({ ...e, cf: "Handle not found" }));
				return false;
			}
			setErrors(({ cf: _, ...rest }) => rest);
			return true;
		} catch {
			setErrors((e) => ({ ...e, cf: "Verification error" }));
			return false;
		} finally {
			setValidating((v) => ({ ...v, cf: false }));
		}
	};

	const validateLcHandle = async (handle: string): Promise<boolean> => {
		if (!handle) return true;
		setValidating((v) => ({ ...v, lc: true }));
		try {
			const res = await fetch("https://leetcode.com/graphql", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: `query { matchedUser(username: "${handle}") { username } }`,
				}),
			});
			const data = await res.json();
			if (!data.data?.matchedUser) {
				setErrors((e) => ({ ...e, lc: "Username not found" }));
				return false;
			}
			setErrors(({ lc: _, ...rest }) => rest);
			return true;
		} catch {
			setErrors(({ lc: _, ...rest }) => rest);
			return true;
		} finally {
			setValidating((v) => ({ ...v, lc: false }));
		}
	};

	const handleSubmit = async () => {
		if (!displayName.trim()) {
			setErrors({ name: "Required" });
			return;
		}

		setLoading(true);
		setErrors({});

		const [cfValid, lcValid] = await Promise.all([
			validateCfHandle(cfHandle.trim()),
			validateLcHandle(lcHandle.trim()),
		]);

		if (!cfValid || !lcValid) {
			setLoading(false);
			return;
		}

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			setErrors({ name: "Session expired" });
			setLoading(false);
			return;
		}

		const rollNumber = user.email ? ROLL.fromEmail(user.email) : null;
		if (!rollNumber) {
			setErrors({ name: "Email error" });
			setLoading(false);
			return;
		}

		const { error } = await supabase.from("profiles").insert({
			id: user.id,
			roll_number: rollNumber,
			display_name: displayName.trim(),
			cf_handle: cfHandle.trim() || null,
			lc_handle: lcHandle.trim() || null,
		});

		if (error) {
			setErrors({ name: error.message });
			setLoading(false);
			return;
		}

		router.push("/dashboard");
	};

	return (
		<div className="min-h-screen bg-void flex items-center justify-center p-4 relative overflow-hidden">
			<div className="absolute inset-0 bg-grid-full opacity-20 pointer-events-none" />
			<div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[150px] pointer-events-none" />

			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
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
								<div className="flex justify-between items-baseline">
									<label
										htmlFor={cfHandleId}
										className="text-text-muted font-mono text-small uppercase tracking-widest font-black"
									>
										CF_HANDLE
									</label>
									{validating.cf && (
										<span className="text-tiny font-mono text-neon-cyan animate-pulse uppercase">
											Verifying...
										</span>
									)}
								</div>
								<div className="relative group">
									<input
										id={cfHandleId}
										type="text"
										placeholder="tourist"
										value={cfHandle}
										onChange={(e) => setCfHandle(e.target.value)}
										className="w-full bg-zinc-950 border border-border-hard p-4 font-mono text-sm focus:border-neon-cyan focus:outline-none transition-colors"
									/>
									{errors.cf && (
										<p className="text-neon-red text-small mt-2 font-mono uppercase font-black">
											{errors.cf}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex justify-between items-baseline">
									<label
										htmlFor={lcHandleId}
										className="text-text-muted font-mono text-small uppercase tracking-widest font-black"
									>
										LC_HANDLE
									</label>
									{validating.lc && (
										<span className="text-tiny font-mono text-neon-cyan animate-pulse uppercase">
											Verifying...
										</span>
									)}
								</div>
								<div className="relative group">
									<input
										id={lcHandleId}
										type="text"
										placeholder="neal_wu"
										value={lcHandle}
										onChange={(e) => setLcHandle(e.target.value)}
										className="w-full bg-zinc-950 border border-border-hard p-4 font-mono text-sm focus:border-neon-cyan focus:outline-none transition-colors"
									/>
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
								{loading ? "SAVING..." : "COMPLETE SETUP →"}
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
		</div>
	);
}
