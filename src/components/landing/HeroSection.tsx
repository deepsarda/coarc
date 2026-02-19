'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { INSTITUTION } from '@/lib/config';

/* Orbiting particle data */
const PARTICLES = [
	{
		id: 0,
		size: 3,
		radius: 160,
		duration: 14,
		delay: -3,
		opacity: 0.25,
		color: '#ff00aa',
	},
	{
		id: 1,
		size: 4,
		radius: 220,
		duration: 18,
		delay: -8,
		opacity: 0.35,
		color: '#00f0ff',
	},
	{
		id: 2,
		size: 2.5,
		radius: 180,
		duration: 22,
		delay: -15,
		opacity: 0.2,
		color: '#00f0ff',
	},
	{
		id: 3,
		size: 3.5,
		radius: 280,
		duration: 16,
		delay: -1,
		opacity: 0.3,
		color: '#ff00aa',
	},
	{
		id: 4,
		size: 2,
		radius: 200,
		duration: 25,
		delay: -12,
		opacity: 0.4,
		color: '#00f0ff',
	},
	{
		id: 5,
		size: 4.5,
		radius: 150,
		duration: 20,
		delay: -6,
		opacity: 0.2,
		color: '#00f0ff',
	},
	{
		id: 6,
		size: 3,
		radius: 260,
		duration: 15,
		delay: -18,
		opacity: 0.35,
		color: '#ff00aa',
	},
	{
		id: 7,
		size: 2.5,
		radius: 300,
		duration: 28,
		delay: -9,
		opacity: 0.25,
		color: '#00f0ff',
	},
	{
		id: 8,
		size: 4,
		radius: 170,
		duration: 13,
		delay: -4,
		opacity: 0.3,
		color: '#00f0ff',
	},
	{
		id: 9,
		size: 3,
		radius: 240,
		duration: 19,
		delay: -14,
		opacity: 0.4,
		color: '#ff00aa',
	},
	{
		id: 10,
		size: 2,
		radius: 190,
		duration: 24,
		delay: -7,
		opacity: 0.2,
		color: '#00f0ff',
	},
	{
		id: 11,
		size: 3.5,
		radius: 310,
		duration: 17,
		delay: -11,
		opacity: 0.3,
		color: '#00f0ff',
	},
];

const TAGS = ['DUELS', 'ATTENDANCE', 'FLASHCARDS', 'STREAKS', 'LEADERBOARDS', 'RESOURCES'];

export default function HeroSection() {
	return (
		<section className="relative min-h-svh w-full max-w-full flex flex-col items-center justify-center text-center px-4 overflow-hidden">
			{/* Drifting gradient blobs */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-1/3 left-1/4 w-72 h-72 md:w-[500px] md:h-[500px] bg-neon-cyan/6 rounded-full blur-[120px] md:blur-[180px] animate-drift" />
				<div className="absolute bottom-1/4 right-1/5 w-56 h-56 md:w-96 md:h-96 bg-neon-magenta/5 rounded-full blur-[100px] md:blur-[150px] animate-drift-reverse" />
			</div>

			{/* Orbiting particles around title */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				{PARTICLES.map((p) => (
					<motion.div
						key={p.id}
						className="absolute rounded-full"
						style={{
							width: p.size,
							height: p.size,
							backgroundColor: p.color,
							boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
							opacity: p.opacity,
						}}
						animate={{
							x: [
								Math.cos(0) * p.radius,
								Math.cos(Math.PI / 2) * p.radius,
								Math.cos(Math.PI) * p.radius,
								Math.cos((3 * Math.PI) / 2) * p.radius,
								Math.cos(2 * Math.PI) * p.radius,
							],
							y: [
								Math.sin(0) * p.radius,
								Math.sin(Math.PI / 2) * p.radius,
								Math.sin(Math.PI) * p.radius,
								Math.sin((3 * Math.PI) / 2) * p.radius,
								Math.sin(2 * Math.PI) * p.radius,
							],
						}}
						transition={{
							duration: p.duration,
							repeat: Infinity,
							ease: 'linear',
							delay: p.delay,
						}}
					/>
				))}
			</div>

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
					<span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_#39ff14]" />
					<span className="text-neon-cyan/80">Live & Active</span>
				</motion.div>

				{/* Title */}
				<h1 className="font-heading font-bold text-6xl sm:text-9xl mb-6 tracking-tighter w-full max-w-full break-words">
					<span className="text-text-primary">CO</span>
					<span className="text-neon-cyan">.</span>
					<span className="text-text-primary">ARC</span>
				</h1>

				{/* Tagline */}
				<p className="text-text-secondary text-base sm:text-xl max-w-xl mx-auto font-body mb-10 leading-relaxed">
					Code. Track. Compete.{' '}
					<span className="text-neon-cyan font-semibold">Everything in one place</span> for{' '}
					<span className="text-neon-cyan font-bold underline decoration-neon-cyan/40 underline-offset-4 decoration-2">
						{INSTITUTION.label}
					</span>
				</p>

				{/* Feature tags */}
				<div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-14 px-2 w-full max-w-[calc(100vw-2rem)]">
					{TAGS.map((label, i) => (
						<motion.span
							key={label}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 + i * 0.07 }}
							className="px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-950 border-2 border-neon-cyan/40 text-neon-cyan rounded-none text-tiny sm:text-small font-mono tracking-mega font-black shadow-brutal-sm relative group cursor-default"
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
					<Link
						href="/login"
						className="btn-neon px-8 sm:px-16 py-3 sm:py-4 text-base sm:text-xl inline-flex items-center justify-center w-full sm:w-auto max-w-[280px] sm:max-w-none"
					>
						JOIN THE ARC →
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
				<span className="text-text-muted text-tiny font-mono uppercase tracking-epic font-bold">
					Scroll to Explore
				</span>
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
