"use client";

import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";
import { ROLL } from "@/lib/config";

function AnimatedNumber({ value }: { value: number }) {
	const ref = useRef<HTMLSpanElement>(null);
	const motionValue = useMotionValue(0);
	const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });
	const isInView = useInView(ref, { once: true });

	useEffect(() => {
		if (isInView) {
			motionValue.set(value);
		}
	}, [isInView, motionValue, value]);

	useEffect(() => {
		const unsubscribe = springValue.on("change", (latest) => {
			if (ref.current) {
				ref.current.textContent = Math.floor(latest).toString();
			}
		});
		return unsubscribe;
	}, [springValue]);

	return <span ref={ref}>0</span>;
}

interface JoinCounterProps {
	count?: number;
	total?: number;
}

export default function JoinCounter({
	count = 42,
	total = ROLL.max,
}: JoinCounterProps) {
	const percent = Math.round((count / total) * 100);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
			className="card-brutal scifi-window p-0 overflow-hidden relative group flex flex-col h-full hover:border-neon-green"
		>
			<div className="card-overlay bg-void!" />
			<div className="absolute inset-0 bg-grid-full opacity-10 pointer-events-none z-0" />

			{/* Corner Decorations (green variant) */}
			<div
				className="corner-deco corner-tl"
				style={{ borderColor: "var(--color-neon-green)" }}
			/>
			<div
				className="corner-deco corner-tr"
				style={{ borderColor: "var(--color-neon-green)" }}
			/>
			<div
				className="corner-deco corner-bl"
				style={{ borderColor: "var(--color-neon-green)" }}
			/>
			<div
				className="corner-deco corner-br"
				style={{ borderColor: "var(--color-neon-green)" }}
			/>

			{/* Window Ribbon */}
			<div className="terminal-bar px-5 bg-zinc-900/80">
				<div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-neon-green/40 to-transparent" />
				<div className="flex items-center gap-3 relative z-10">
					<div className="flex gap-1">
						<div className="w-1.5 h-1.5 rounded-full bg-neon-green/40" />
						<div className="w-1.5 h-1.5 rounded-full bg-neon-green/20" />
					</div>
					<h3 className="font-mono font-black text-text-primary text-tiny uppercase tracking-mega flex items-center gap-2">
						<span className="text-neon-green">::</span> Roster_Sync
					</h3>
				</div>
				<div className="flex items-center gap-4 relative z-10">
					<span className="font-mono text-neon-green text-tiny tracking-widest font-black uppercase">
						{percent}%_Joined
					</span>
				</div>
			</div>

			{/* Body */}
			<div className="p-6 md:p-8 relative flex-1 flex flex-col justify-center z-10">
				{/* Background scanline effect placeholder (handled by scifi-window-scan) */}

				<div className="flex items-baseline justify-center gap-3 mb-8 relative z-10">
					<span className="font-mono text-7xl font-black text-neon-green tabular-nums counter-glow tracking-tighter drop-shadow-[0_0_15px_rgba(57,255,20,0.3)]">
						<AnimatedNumber value={count} />
					</span>
					<span className="font-mono text-2xl text-text-dim">/{total}</span>
				</div>
				<p className="text-text-secondary font-mono text-tiny text-center mb-10 uppercase tracking-mega opacity-60 font-bold">
					Classmates indexed in the arc
				</p>

				{/* Progress bar */}
				<div className="h-3 bg-void border border-border-hard rounded-none overflow-hidden p-[1.5px] relative">
					<motion.div
						initial={{ width: 0 }}
						whileInView={{ width: `${(count / total) * 100}%` }}
						viewport={{ once: true }}
						transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
						className="h-full rounded-none relative overflow-hidden"
						style={{
							background: "linear-gradient(90deg, #39ff14, #00f0ff)",
						}}
					>
						<div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-24 animate-[move-light_2s_infinite] pointer-events-none" />
					</motion.div>
				</div>

				<div className="flex justify-between mt-4">
					<div className="flex gap-1.5">
						{["d1", "d2", "d3"].map((key, i) => (
							<div
								key={key}
								className={`w-${4 - i} h-[2px] bg-neon-green/30`}
							/>
						))}
					</div>
					<span className="font-mono text-micro text-text-muted tracking-mega uppercase font-bold">
						System_Active :: Roster_Sync_Enabled
					</span>
				</div>
			</div>
		</motion.div>
	);
}
