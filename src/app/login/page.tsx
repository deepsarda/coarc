"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ROLL } from "@/lib/config";

function LoginForm() {
	const searchParams = useSearchParams();
	const [rollNumber, setRollNumber] = useState("");
	const [email, setEmail] = useState("");
	const [step, setStep] = useState<"input" | "confirm" | "sent">("input");
	const [error, setError] = useState(
		searchParams.get("error") === "auth_failed"
			? "Authentication failed. Try again."
			: "",
	);
	const [loading, setLoading] = useState(false);

	const handleSubmit = () => {
		const roll = parseInt(rollNumber, 10);
		if (!ROLL.isValid(roll)) {
			setError(
				`Enter a valid roll number (${String(ROLL.min).padStart(2, "0")}–${ROLL.max})`,
			);
			return;
		}
		setError("");
		setEmail(ROLL.toEmail(roll));
		setStep("confirm");
	};

	const handleSendLink = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/auth/validate-roll", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rollNumber }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error);
				setStep("input");
			} else {
				setStep("sent");
			}
		} catch {
			setError("Network error. Try again.");
			setStep("input");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-void flex items-center justify-center p-4 relative overflow-hidden">
			<div className="absolute inset-0 bg-grid-full opacity-20 pointer-events-none" />
			<div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[150px] pointer-events-none" />

			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="w-full max-w-md relative z-10"
			>
				<div className="text-center mb-10">
					<h1 className="font-heading text-5xl font-black text-text-primary tracking-tighter uppercase">
						co<span className="text-neon-cyan">.</span>arc
					</h1>
					<p className="text-text-muted mt-3 font-mono text-[10px] uppercase tracking-[0.4em] font-bold">
						SEASON 01 :: ACCESS PROTOCOL
					</p>
				</div>

				<div className="card-brutal scifi-window p-0 overflow-hidden relative">
					<div className="absolute inset-0 bg-zinc-900/50 pointer-events-none" />

					<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-cyan opacity-40 z-20" />
					<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-cyan opacity-40 z-20" />
					<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-cyan opacity-40 z-20" />
					<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-cyan opacity-40 z-20" />

					<div className="px-5 py-2.5 border-b border-border-hard flex items-center justify-between bg-zinc-950/80 backdrop-blur-md relative z-10">
						<div className="flex items-center gap-3">
							<div className="flex gap-1.5">
								<div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_8px_#ff0040]" />
								<div className="w-2 h-2 rounded-full bg-neon-yellow shadow-[0_0_8px_#ffe600]" />
								<div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_#39ff14]" />
							</div>
							<h3 className="font-mono text-[10px] text-neon-cyan uppercase tracking-[0.2em] font-black">
								:: AUTHENTICATION
							</h3>
						</div>
					</div>

					<div className="p-8 relative z-10">
						{step === "input" && (
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								className="space-y-6"
							>
								<div>
									<label
										htmlFor="roll-input"
										className="block text-neon-cyan font-mono mb-4 text-[10px] uppercase tracking-[0.3em] font-black"
									>
										:: ENTER YOUR ROLL NUMBER
									</label>
									<div className="flex gap-4">
										<input
											id="roll-input"
											type="text"
											inputMode="numeric"
											maxLength={2}
											placeholder="01"
											value={rollNumber}
											onChange={(e) => {
												setRollNumber(e.target.value.replace(/\D/g, ""));
												setError("");
											}}
											onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
											className="flex-1 bg-zinc-950 border-2 border-border-hard p-4 text-center text-3xl font-mono tracking-[0.4em] focus:border-neon-cyan focus:outline-none transition-colors text-white font-black"
										/>
									</div>
								</div>

								<button
									type="button"
									onClick={handleSubmit}
									className="btn-neon w-full py-4 text-sm tracking-[0.2em]"
								>
									CONTINUE →
								</button>

								{error && (
									<div className="bg-neon-red/10 border border-neon-red/30 p-3 flex items-center gap-3">
										<div className="w-2 h-2 bg-neon-red rounded-full animate-pulse shadow-[0_0_8px_#ff0040]" />
										<p className="text-neon-red text-[10px] font-mono font-black uppercase tracking-widest">
											{error}
										</p>
									</div>
								)}
							</motion.div>
						)}

						{step === "confirm" && (
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								className="text-center space-y-8 py-4"
							>
								<div className="space-y-2">
									<p className="text-text-muted font-mono text-[10px] uppercase tracking-widest font-bold">
										EMAIL DETECTED
									</p>
									<p className="text-white font-mono text-xl break-all font-black tracking-tight">
										{email}
									</p>
								</div>
								<p className="text-text-secondary text-xs font-mono uppercase tracking-widest bg-zinc-950 p-3 border border-border-hard/50">
									Confirm identity to proceed
								</p>
								<div className="flex gap-4">
									<button
										type="button"
										onClick={() => setStep("input")}
										className="bg-zinc-900 border border-border-hard text-text-primary px-6 py-4 flex-1 font-mono text-[10px] uppercase tracking-widest font-black hover:bg-zinc-800 transition-colors"
									>
										Back
									</button>
									<button
										type="button"
										onClick={handleSendLink}
										disabled={loading}
										className="btn-neon px-6 py-4 flex-1 disabled:opacity-50 text-[10px] tracking-widest"
									>
										{loading ? "SENDING..." : "SEND MAGIC LINK"}
									</button>
								</div>
							</motion.div>
						)}

						{step === "sent" && (
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="text-center space-y-6 pt-4 pb-2"
							>
								<div className="inline-flex w-20 h-20 bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center relative group">
									<div className="absolute inset-0 bg-neon-cyan/20 animate-pulse" />
									<span className="text-4xl text-neon-cyan drop-shadow-[0_0_10px_#00f0ff] relative z-10">
										📧
									</span>
								</div>
								<div className="space-y-2">
									<h2 className="font-mono text-lg font-black text-white uppercase tracking-widest">
										LINK SENT
									</h2>
									<p className="text-text-secondary font-mono text-xs leading-relaxed uppercase tracking-widest px-4">
										Magic link sent to{" "}
										<span className="text-neon-cyan font-black">{email}</span>
									</p>
								</div>
								<div className="bg-zinc-950 p-4 border border-border-hard/50 space-y-2">
									<p className="text-text-muted text-[10px] font-mono leading-relaxed uppercase tracking-widest">
										Link expires in 60m
									</p>
								</div>
								<button
									type="button"
									onClick={() => {
										setStep("input");
										setRollNumber("");
									}}
									className="text-text-secondary hover:text-white font-mono text-[9px] uppercase tracking-[0.3em] font-black transition-colors"
								>
									[ Use different email ]
								</button>
							</motion.div>
						)}
					</div>
				</div>

				<div className="mt-8 flex items-center justify-center gap-4 opacity-50">
					<div className="h-[1px] w-12 bg-border-hard" />
					<p className="text-text-muted text-[9px] font-mono uppercase tracking-[0.4em] font-black">
						SVNIT EXCLUSIVE
					</p>
					<div className="h-[1px] w-12 bg-border-hard" />
				</div>
			</motion.div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-void flex items-center justify-center">
					<div className="w-12 h-12 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-none animate-spin" />
				</div>
			}
		>
			<LoginForm />
		</Suspense>
	);
}
