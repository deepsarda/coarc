"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Shield, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { ROLL } from "@/lib/config";

/* Floating grid crosses */
const CROSSES = [
	{ id: 0, x: "12%", y: "8%", size: 8, opacity: 0.05, delay: -2, duration: 9 },
	{
		id: 1,
		x: "75%",
		y: "12%",
		size: 12,
		opacity: 0.06,
		delay: -5,
		duration: 11,
	},
	{
		id: 2,
		x: "33%",
		y: "22%",
		size: 10,
		opacity: 0.04,
		delay: -1,
		duration: 8,
	},
	{
		id: 3,
		x: "88%",
		y: "35%",
		size: 7,
		opacity: 0.05,
		delay: -7,
		duration: 10,
	},
	{
		id: 4,
		x: "20%",
		y: "45%",
		size: 9,
		opacity: 0.04,
		delay: -3,
		duration: 12,
	},
	{
		id: 5,
		x: "60%",
		y: "18%",
		size: 11,
		opacity: 0.06,
		delay: -6,
		duration: 7,
	},
	{ id: 6, x: "45%", y: "72%", size: 8, opacity: 0.05, delay: -4, duration: 9 },
	{
		id: 7,
		x: "80%",
		y: "60%",
		size: 10,
		opacity: 0.04,
		delay: 0,
		duration: 11,
	},
	{ id: 8, x: "15%", y: "80%", size: 7, opacity: 0.06, delay: -2, duration: 8 },
	{
		id: 9,
		x: "55%",
		y: "55%",
		size: 9,
		opacity: 0.05,
		delay: -5,
		duration: 13,
	},
	{
		id: 10,
		x: "70%",
		y: "85%",
		size: 12,
		opacity: 0.04,
		delay: -1,
		duration: 10,
	},
	{
		id: 11,
		x: "28%",
		y: "65%",
		size: 8,
		opacity: 0.06,
		delay: -7,
		duration: 9,
	},
	{
		id: 12,
		x: "92%",
		y: "15%",
		size: 10,
		opacity: 0.05,
		delay: -3,
		duration: 8,
	},
	{
		id: 13,
		x: "40%",
		y: "90%",
		size: 7,
		opacity: 0.04,
		delay: -6,
		duration: 11,
	},
	{
		id: 14,
		x: "65%",
		y: "42%",
		size: 11,
		opacity: 0.05,
		delay: -4,
		duration: 7,
	},
	{
		id: 15,
		x: "10%",
		y: "55%",
		size: 9,
		opacity: 0.06,
		delay: 0,
		duration: 12,
	},
	{
		id: 16,
		x: "50%",
		y: "30%",
		size: 8,
		opacity: 0.04,
		delay: -2,
		duration: 10,
	},
	{
		id: 17,
		x: "85%",
		y: "78%",
		size: 10,
		opacity: 0.05,
		delay: -5,
		duration: 9,
	},
];

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, hasProfile, loading: authLoading } = useAuthContext();
	const [rollNumber, setRollNumber] = useState("");
	const [email, setEmail] = useState("");
	const [step, setStep] = useState<"input" | "confirm" | "sent">("input");
	const [error, setError] = useState(
		searchParams.get("error") === "auth_failed"
			? "Authentication failed. Try again."
			: "",
	);
	const [loading, setLoading] = useState(false);
	const rollId = useId();

	useEffect(() => {
		if (!authLoading && user) {
			if (hasProfile) {
				router.replace("/dashboard");
			} else {
				router.replace("/setup");
			}
		}
	}, [authLoading, user, hasProfile, router]);

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
		<div className="min-h-screen bg-void flex flex-col items-center justify-center p-4 relative overflow-hidden">
			{/* Grid */}
			<div className="absolute inset-0 bg-grid-full pointer-events-none" />

			{/* Large drifting gradient orbs */}
			<div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-neon-cyan/6 rounded-full blur-[180px] pointer-events-none animate-drift" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-neon-magenta/5 rounded-full blur-[160px] pointer-events-none animate-drift-reverse" />
			<div
				className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-neon-cyan/3 rounded-full blur-[120px] pointer-events-none animate-drift"
				style={{ animationDelay: "-12s" }}
			/>

			{/* Floating crosses */}
			{CROSSES.map((c) => (
				<motion.div
					key={c.id}
					className="absolute pointer-events-none text-neon-cyan font-mono"
					style={{
						left: c.x,
						top: c.y,
						fontSize: c.size,
						opacity: c.opacity,
					}}
					animate={{
						y: [0, -15, 0],
						opacity: [c.opacity, c.opacity * 1.8, c.opacity],
					}}
					transition={{
						duration: c.duration,
						repeat: Infinity,
						ease: "easeInOut",
						delay: c.delay,
					}}
				>
					+
				</motion.div>
			))}

			{/* Radial vignette */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

			{/* Horizontal accent lines */}
			<div className="absolute top-[18%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/8 to-transparent pointer-events-none" />
			<div className="absolute bottom-[22%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-magenta/6 to-transparent pointer-events-none" />

			{/* Content (vertical layout) */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
				className="w-full max-w-md relative z-10"
			>
				{/* Brand */}
				<div className="text-center mb-8 md:mb-12">
					<h1 className="font-heading text-5xl md:text-6xl font-black text-text-primary tracking-tighter uppercase mb-3">
						CO<span className="text-neon-cyan">.</span>ARC
					</h1>
					<p className="text-text-muted font-mono text-small uppercase tracking-epic font-bold">
						SYSTEM :: ACCESS PROTOCOL
					</p>
				</div>

				{/* Login card */}
				<div className="card-brutal scifi-window p-0 overflow-hidden relative group">
					<div className="card-overlay" />

					<div className="corner-deco corner-tl" />
					<div className="corner-deco corner-tr" />
					<div className="corner-deco corner-bl" />
					<div className="corner-deco corner-br" />

					<div className="terminal-bar px-2.5 md:px-5">
						<div className="flex items-center gap-3">
							<div className="traffic-lights">
								<div className="status-dot status-dot-red" />
								<div className="status-dot status-dot-yellow" />
								<div className="status-dot status-dot-green" />
							</div>
							<h3 className="scifi-label">:: AUTHENTICATION</h3>
						</div>
						<div className="flex items-center gap-2">
							<Shield className="w-3 h-3 text-neon-green" />
							<span className="scifi-label text-neon-green">SECURE</span>
						</div>
					</div>

					<div className="p-4 md:p-8 relative z-10">
						<AnimatePresence mode="wait">
							{step === "input" && (
								<motion.div
									key="input"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									className="space-y-6"
								>
									<div>
										<label
											htmlFor={rollId}
											className="block text-neon-cyan font-mono mb-4 text-small uppercase tracking-mega font-black"
										>
											:: ENTER YOUR ROLL NUMBER
										</label>

										<input
											id={rollId}
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
											className="form-input text-center text-2xl md:text-3xl tracking-[0.3em] md:tracking-[0.4em] border-2 font-black"
										/>
									</div>

									<button
										type="button"
										onClick={handleSubmit}
										className="btn-neon w-full py-4 text-sm tracking-[0.2em]"
									>
										CONTINUE →
									</button>

									{error && (
										<motion.div
											initial={{ opacity: 0, y: -5 }}
											animate={{ opacity: 1, y: 0 }}
											className="bg-neon-red/10 border border-neon-red/30 p-3 flex items-center gap-3"
										>
											<div className="status-dot status-dot-red" />
											<p className="text-neon-red text-small font-mono font-black uppercase tracking-widest">
												{error}
											</p>
										</motion.div>
									)}

									{/* XP teaser */}
									<div className="pt-2 flex items-center justify-center gap-3 opacity-60">
										<Zap className="w-3.5 h-3.5 text-neon-yellow" />
										<span className="font-mono text-tiny text-text-muted tracking-mega uppercase font-black">
											+50 XP welcome bonus
										</span>
									</div>
								</motion.div>
							)}

							{step === "confirm" && (
								<motion.div
									key="confirm"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									className="text-center space-y-8 py-4"
								>
									<div className="space-y-2">
										<p className="form-label">EMAIL DETECTED</p>
										<p className="text-white font-mono text-xl break-all font-black tracking-tight">
											{email}
										</p>
									</div>
									<p className="text-text-secondary text-sm font-mono uppercase tracking-widest bg-zinc-950 p-4 border border-border-subtle">
										Confirm identity to proceed
									</p>
									<div className="flex gap-4">
										<button
											type="button"
											onClick={() => setStep("input")}
											className="bg-zinc-900 border border-border-hard text-text-primary px-6 py-4 flex-1 font-mono text-small uppercase tracking-widest font-black hover:bg-zinc-800 transition-colors"
										>
											Back
										</button>
										<button
											type="button"
											onClick={handleSendLink}
											disabled={loading}
											className="btn-neon px-6 py-4 flex-1 disabled:opacity-50 text-small tracking-widest"
										>
											{loading ? "SENDING..." : "SEND MAGIC LINK"}
										</button>
									</div>
								</motion.div>
							)}

							{step === "sent" && (
								<motion.div
									key="sent"
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									className="text-center space-y-6 pt-4 pb-2"
								>
									<div className="inline-flex w-20 h-20 bg-neon-cyan/10 border-2 border-neon-cyan/30 items-center justify-center relative group">
										<div className="absolute inset-0 bg-neon-cyan/20 animate-pulse" />
										<span className="text-4xl text-neon-cyan drop-shadow-[0_0_10px_#00f0ff] relative z-10">
											📧
										</span>
									</div>
									<div className="space-y-2">
										<h2 className="font-mono text-lg font-black text-white uppercase tracking-widest">
											LINK SENT
										</h2>
										<p className="text-text-secondary font-mono text-sm leading-relaxed uppercase tracking-widest px-4">
											Magic link sent to{" "}
											<span className="text-neon-cyan font-black">{email}</span>
										</p>
									</div>
									<div className="bg-zinc-950 p-4 border border-border-subtle space-y-2">
										<p className="text-text-muted text-small font-mono leading-relaxed uppercase tracking-widest">
											Link expires in 60m
										</p>
									</div>
									<button
										type="button"
										onClick={() => {
											setStep("input");
											setRollNumber("");
										}}
										className="text-text-secondary hover:text-white font-mono text-small uppercase tracking-mega font-black transition-colors"
									>
										[ Use different email ]
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>

				{/* Footer line */}
				<div className="mt-8 flex items-center justify-center gap-4 opacity-50">
					<div className="h-[1px] w-12 bg-border-hard" />
					<p className="text-text-muted text-small font-mono uppercase tracking-epic font-black">
						EXCLUSIVE TO SVNIT AI 2k29
					</p>
					<div className="h-[1px] w-12 bg-border-hard" />
				</div>

				<div className="mt-6 text-center">
					<Link
						href="/"
						className="text-text-dim hover:text-neon-cyan font-mono text-tiny uppercase tracking-mega font-black transition-colors"
					>
						← BACK TO CO.ARC
					</Link>
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
