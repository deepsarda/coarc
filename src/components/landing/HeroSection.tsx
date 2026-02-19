'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { INSTITUTION } from '@/lib/config';

export default function HeroSection() {
	return (
		<section className="relative min-h-svh w-full max-w-full flex flex-col items-center justify-center text-center px-4 bg-grid overflow-hidden">
			{/* Ambient glow blobs - Pure Cyan centric */}
			<div className="absolute top-1/4 left-1/4 w-60 h-60 md:w-128 md:h-128 bg-neon-cyan/5 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />
			<div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-neon-cyan/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

			{/* Content */}
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
				className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center"
			>
				{/* Status pill */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.2, duration: 0.4 }}
					className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-surface border border-neon-cyan/20 rounded-none text-tiny font-mono tracking-ultra uppercase font-black"
				>
					<span className="w-1.5 h-1.5 bg-neon-yellow rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]" />
					<span className="text-neon-cyan/80">Under development</span>
				</motion.div>

				{/* Title */}
				<h1 className="font-heading font-bold text-6xl sm:text-9xl mb-6 tracking-tighter w-full max-w-full break-words">
					<span className="text-text-primary">co</span>
					<span className="text-neon-cyan">.</span>
					<span className="text-text-primary">arc</span>
				</h1>

				{/* Tagline */}
				<p className="text-text-secondary text-base sm:text-xl max-w-lg mx-auto font-body mb-10 leading-relaxed">
					Competitive programming tracker for{' '}
					<span className="text-neon-cyan font-bold underline decoration-neon-cyan/40 underline-offset-4 decoration-2">
						{INSTITUTION.label}
					</span>
				</p>

				{/* Feature tags */}
				<div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-14 px-2 w-full max-w-[calc(100vw-2rem)] md:max-w-lg">
					{['XP', 'BADGES', 'DUELS', 'LEADERBOARDS', 'STREAKS'].map((label, i) => (
						<motion.span
							key={label}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 + i * 0.08 }}
							className="px-3 sm:px-5 py-1.5 sm:py-2 bg-zinc-950 border-2 border-neon-cyan/40 text-neon-cyan rounded-none text-tiny sm:text-small font-mono tracking-mega font-black shadow-brutal-sm relative group cursor-default"
						>
							<div className="absolute inset-0 bg-neon-cyan opacity-0 group-hover:opacity-10 transition-opacity" />
							{label}
						</motion.span>
					))}
				</div>

				<motion.div
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.98 }}
					className="w-full flex justify-center"
				>
					<Link href="/login" className="btn-neon px-8 sm:px-16 py-3 sm:py-4 text-base sm:text-xl inline-flex items-center justify-center w-full sm:w-auto max-w-[280px] sm:max-w-none">
						START COMPETING →
					</Link>
				</motion.div>
			</motion.div>

			{/* Scroll indicator */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.2 }}
				className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
			>
				<span className="text-text-muted text-tiny font-mono uppercase tracking-epic font-bold">Scroll to Explore</span>
				<div className="w-[2px] h-12 sm:h-16 bg-gradient-to-b from-border-hard via-neon-cyan/40 to-transparent relative">
					<motion.div
						animate={{ top: ['0%', '100%', '0%'] }}
						transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
						className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-neon-cyan rounded-full shadow-[0_0_12px_rgba(0,240,255,0.8)]"
					/>
				</div>
			</motion.div>
		</section>
	);
}
