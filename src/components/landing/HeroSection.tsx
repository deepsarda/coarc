'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { INSTITUTION } from '@/lib/config';

export default function HeroSection() {
	return (
		<section className="relative min-h-[100vh] flex flex-col items-center justify-center text-center px-4 bg-grid">
			{/* Ambient glow blobs - Pure Cyan centric */}
			<div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[150px] pointer-events-none" />
			<div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neon-cyan/5 rounded-full blur-[120px] pointer-events-none" />

			{/* Content */}
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
				className="relative z-10"
			>
				{/* Status pill */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.2, duration: 0.4 }}
					className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-surface border border-neon-cyan/20 rounded-none text-[10px] font-mono tracking-widest uppercase font-black"
				>
					<span className="w-1.5 h-1.5 bg-neon-yellow rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]" />
					<span className="text-neon-cyan/80">Under development</span>
				</motion.div>

				{/* Title */}
				<h1 className="font-heading font-bold text-7xl sm:text-9xl mb-6 tracking-tighter">
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
				<div className="flex flex-wrap items-center justify-center gap-4 mb-14">
					{['XP', 'BADGES', 'DUELS', 'LEADERBOARDS', 'STREAKS'].map((label, i) => (
						<motion.span
							key={label}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 + i * 0.08 }}
							className="px-5 py-2 bg-zinc-950 border-2 border-neon-cyan/40 text-neon-cyan rounded-none text-[12px] font-mono tracking-[0.2em] font-black shadow-brutal-sm relative group cursor-default"
						>
							<div className="absolute inset-0 bg-neon-cyan opacity-0 group-hover:opacity-10 transition-opacity" />
							{label}
						</motion.span>
					))}
				</div>

				{/* CTA Button */}
				<motion.div
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.98 }}
				>
					<Link href="/login" className="btn-neon px-16 py-4 text-xl inline-block">
						START COMPETING →
					</Link>
				</motion.div>
			</motion.div>

			{/* Scroll indicator */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.2 }}
				className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
			>
				<span className="text-text-muted text-[10px] font-mono uppercase tracking-[0.4em] font-bold">Scroll to Explore</span>
				<div className="w-[2px] h-16 bg-gradient-to-b from-border-hard via-neon-cyan/40 to-transparent relative">
					<motion.div
						animate={{ top: ['0%', '100%', '0%'] }}
						transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
						className="absolute left-1/2 -translate-x-1/2 w-[6px] h-[6px] bg-neon-cyan rounded-full shadow-[0_0_12px_rgba(0,240,255,0.8)]"
					/>
				</div>
			</motion.div>
		</section>
	);
}
