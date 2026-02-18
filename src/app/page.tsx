'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import BlurredLeaderboard from '@/components/landing/BlurredLeaderboard';
import HeroSection from '@/components/landing/HeroSection';
import JoinCounter from '@/components/landing/JoinCounter';
import { SITE } from '@/lib/config';

const FEATURES = [
	{ icon: '⚔️', title: 'Duels', desc: 'Challenge classmates to 1v1 coding battles.' },
	{ icon: '🐉', title: 'Boss Raids', desc: 'Weekly community bosses. Defeat them as a class.' },
	{ icon: '🔥', title: 'Streaks', desc: 'Maintain daily solve streaks with shields & fire.' },
	{ icon: '🏆', title: 'Leaderboards', desc: 'Global rankings for XP, ELO, and Seasonal titles.' },
	{ icon: '🎖️', title: 'Badges', desc: 'Unlock rare technical achievement badges.' },
	{ icon: '📊', title: 'Analytics', desc: 'Your CF & LC progress tracked in real-time.' },
];

const containerVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.08,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
	},
};

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-grid-full overflow-x-hidden">
			<HeroSection />

			{/* Content sections */}
			<section className="relative z-10 py-24 px-4 max-w-6xl mx-auto space-y-32">
				{/* Section Separator */}
				<div className="relative h-24 flex items-center justify-center overflow-hidden">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-border-hard opacity-30" />
					</div>
					<div className="relative px-8 bg-void border-x border-border-hard flex items-center gap-4 py-2">
						<span className="w-2 h-2 bg-neon-cyan animate-pulse" />
						<span className="font-mono text-[10px] tracking-[0.5em] text-neon-cyan uppercase font-bold">
							SYSTEM_OPERATIONAL
						</span>
						<span className="w-2 h-2 bg-neon-cyan animate-pulse" />
					</div>
				</div>

				{/* Leaderboard */}
				<div className="relative">
					<BlurredLeaderboard />
				</div>

				{/* Features */}
				<div className="pt-16">
					<div className="flex flex-col items-center mb-16 text-center">
						<div className="h-16 w-[2px] bg-gradient-to-t from-neon-cyan to-transparent mb-6" />
						<motion.h2
							initial={{ opacity: 0, y: 10 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4 }}
							className="font-heading font-bold text-text-primary text-4xl tracking-tighter uppercase"
						>
							Inside the <span className="text-neon-cyan">Arc</span>
						</motion.h2>
						<p className="font-mono text-[10px] text-text-muted mt-2 tracking-[0.3em] uppercase">
							SYSTEM_CORE :: MODULES_LOADED
						</p>
					</div>

					<motion.div
						variants={containerVariants}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: '-50px' }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
					>
						{FEATURES.map((feature) => (
							<motion.div
								key={feature.title}
								variants={itemVariants}
								className="p-8 card-brutal scifi-window border-t-2 border-t-neon-cyan group transition-all duration-300 relative overflow-hidden"
							>
								<div className="absolute inset-0 bg-void/50 pointer-events-none z-0" />
								
								{/* Component Corner Decorations */}
								<div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-cyan opacity-40 z-20 group-hover:opacity-100 transition-opacity" />
								<div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-cyan opacity-40 z-20 group-hover:opacity-100 transition-opacity" />
								
								<div className="flex items-start justify-between mb-8 relative z-10">
									<div className="w-16 h-16 rounded-sm bg-zinc-900 border border-border-hard flex items-center justify-center text-4xl grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110 relative">
										<div className="absolute inset-0 bg-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
										{feature.icon}
									</div>
									<div className="text-right">
										<div className="font-mono text-[9px] text-neon-cyan/60 font-black mb-1 tracking-widest">ARC_ID</div>
										<div className="font-mono text-[10px] text-text-muted font-black tracking-tighter">
											NODE_CONNECTED
										</div>
									</div>
								</div>
								
								<h4 className="font-mono font-black text-lg mb-3 tracking-widest uppercase relative z-10 text-neon-cyan">
									{feature.title}
								</h4>
								<p className="text-text-secondary text-xs font-mono leading-relaxed opacity-80 min-h-[3em] relative z-10">
									{feature.desc}
								</p>
								
								<div className="mt-8 pt-6 border-t border-border-hard/50 flex items-center justify-between relative z-10">
									<div className="flex items-center gap-2">
										<div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
										<span className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] font-black">LINK_ACTIVE</span>
									</div>
									<div className="flex gap-1.5">
										<div className="w-1.5 h-[1px] bg-neon-cyan" />
										<div className="w-1.5 h-[1px] bg-neon-cyan/50" />
									</div>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>

				{/* Combined Join Counter + Info Row */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch pt-8">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: '-50px' }}
						transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
						className="h-full"
					>
						<div className="h-full">
							<JoinCounter />
						</div>
					</motion.div>

					<div className="flex flex-col justify-center space-y-8 p-4">
						<div className="space-y-4">
							<h3 className="font-heading font-black text-2xl text-text-primary tracking-tight uppercase">
								Your journey starts <span className="text-neon-cyan">here</span>.
							</h3>
							<p className="text-text-secondary font-mono text-sm leading-relaxed">
								Sync your profiles from Codeforces, LeetCode, and AtCoder to start competing in the global SVNIT ecosystem. Earn XP for every problem solved and climb the ranks to become the top node.
							</p>
						</div>
						<div className="flex flex-wrap gap-4">
							<div className="px-4 py-2 bg-zinc-900 border border-border-hard rounded-sm flex items-center gap-3">
								<div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
								<span className="font-mono text-[10px] text-text-primary uppercase tracking-widest">Codeforces</span>
							</div>
							<div className="px-4 py-2 bg-zinc-900 border border-border-hard rounded-sm flex items-center gap-3">
								<div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
								<span className="font-mono text-[10px] text-text-primary uppercase tracking-widest">LeetCode</span>
							</div>
						</div>
					</div>
				</div>

				{/* Genesis Badge - At the end */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					whileInView={{ opacity: 1, scale: 1 }}
					viewport={{ once: true, margin: '-100px' }}
					transition={{ duration: 0.6 }}
					className="max-w-3xl mx-auto pt-12"
				>
					<div className="card-brutal-accent scifi-window p-0 overflow-hidden relative group">
						<div className="absolute inset-0 bg-void pointer-events-none z-0" />
						
						{/* Component Corner Decorations */}
						<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-cyan opacity-50 z-20 group-hover:opacity-100 transition-opacity" />
						<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-cyan opacity-50 z-20 group-hover:opacity-100 transition-opacity" />
						<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-cyan opacity-50 z-20 group-hover:opacity-100 transition-opacity" />
						<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-cyan opacity-50 z-20 group-hover:opacity-100 transition-opacity" />

						{/* Background decorative elements */}
						<div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />
						<div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-magenta/5 -ml-16 -mb-16 rounded-full blur-3xl pointer-events-none" />
						
						<div className="px-5 py-2.5 border-b border-neon-cyan/30 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md relative z-10">
							<div className="flex items-center gap-3">
								<div className="flex gap-1.5">
									<div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_8px_#ff0040]" />
									<div className="w-2 h-2 rounded-full bg-neon-yellow shadow-[0_0_8px_#ffe600]" />
									<div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_#39ff14]" />
								</div>
								<h3 className="font-mono text-[11px] text-neon-cyan uppercase tracking-[0.2em] font-black">
									:: SEASON_01_REWARDS :: GENESIS_BADGE
								</h3>
							</div>
							<span className="font-mono text-[10px] text-neon-cyan/40 font-black tracking-widest">EST_2026</span>
						</div>
						
						<div className="p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
							<div className="flex-1 space-y-7">
								<div className="space-y-3">
									<p className="text-white font-mono text-xl font-black leading-tight uppercase tracking-tight">
										JOIN THE <span className="text-neon-cyan">FIRST 20 STUDENTS</span>
									</p>
									<p className="text-text-secondary text-[13px] font-mono leading-relaxed">
										The first 20 students to connect their profiles earn a unique Genesis Badge. This badge is a permanent mark on your profile, proving you were here from day one.
									</p>
								</div>
								
								<div className="h-[1px] w-full bg-gradient-to-r from-neon-cyan/30 via-neon-cyan/10 to-transparent" />
								
								<div className="flex items-center gap-8">
									<div>
										<div className="text-[9px] font-mono text-text-muted mb-1 font-black uppercase tracking-widest">Remaining</div>
										<div className="flex items-baseline gap-1">
											<motion.span
												animate={{ opacity: [1, 0.4, 1] }}
												transition={{ duration: 1.5, repeat: Infinity }}
												className="text-white font-mono text-5xl font-black tabular-nums tracking-tighter"
											>
												20
											</motion.span>
											<span className="text-text-muted font-mono text-xl font-black opacity-40">/20</span>
										</div>
									</div>
									<div className="h-14 w-[1px] bg-border-hard/50" />
									<div className="flex-1">
										<div className="h-2.5 w-full bg-void border border-border-hard p-[2px] rounded-none">
											<div className="h-full w-full bg-neon-cyan/20 animate-pulse" />
										</div>
										<p className="text-[9px] font-mono text-neon-cyan mt-3 tracking-widest uppercase font-black">Waiting for first students to join</p>
									</div>
								</div>
							</div>
							
							<div className="w-44 h-44 flex-shrink-0 relative">
								<div className="absolute inset-0 bg-neon-cyan/15 blur-2xl animate-pulse" />
								<div className="w-full h-full border-2 border-neon-cyan/40 rounded-none transform rotate-45 flex items-center justify-center p-4 bg-zinc-900 border-double border-4 border-neon-cyan/20 relative z-10 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
									<div className="transform -rotate-45 text-6xl drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">🌌</div>
								</div>
								{/* Technical accents */}
								<div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-neon-cyan z-20" />
								<div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-neon-cyan z-20" />
							</div>
						</div>
					</div>
				</motion.div>

				{/* Final CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="text-center py-20"
				>
					<div className="inline-block relative">
						<div className="absolute -inset-8 bg-neon-cyan/5 blur-3xl rounded-full" />
						<p className="text-text-muted text-xs font-mono mb-8 uppercase tracking-[0.4em] relative">
							Ready to compete?
						</p>
						<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
							<Link href="/login" className="btn-neon px-16 py-4 text-base inline-block">
								START COMPETING →
							</Link>
						</motion.div>
					</div>
				</motion.div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 border-t border-border-hard/50 py-12 bg-void/50 backdrop-blur-sm">
				<div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-6">
					<div className="flex gap-10 text-[11px] font-mono text-text-secondary tracking-[0.3em] uppercase mb-4 font-black">
						<span className="hover:text-neon-cyan transition-colors cursor-pointer relative group">
							Security
							<div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-neon-cyan transition-all group-hover:w-full" />
						</span>
						<span className="hover:text-neon-cyan transition-colors cursor-pointer relative group">
							Protocol
							<div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-neon-cyan transition-all group-hover:w-full" />
						</span>
						<span className="hover:text-neon-cyan transition-colors cursor-pointer relative group">
							Terminal
							<div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-neon-cyan transition-all group-hover:w-full" />
						</span>
					</div>
					<p className="text-text-primary text-[12px] font-mono uppercase tracking-[0.2em] font-black opacity-100 flex items-center gap-3">
						<span className="text-neon-cyan/50">::</span>
						{SITE.footer}
						<span className="text-neon-cyan/50">::</span>
					</p>
				</div>
			</footer>
		</div>
	);
}
