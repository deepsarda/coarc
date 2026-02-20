'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MoreHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { MOBILE_NAV_ITEMS, NAV_ITEMS } from '@/lib/utils/navIcons';

export default function MobileNav() {
	const pathname = usePathname();
	const { profile } = useAuthContext();
	const [drawerOpen, setDrawerOpen] = useState(false);

	return (
		<>
			<nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-base/95 backdrop-blur-md border-t border-border-hard">
				<div className="flex items-center justify-around h-16 px-2">
					{MOBILE_NAV_ITEMS.map((item) => {
						// Replace the profile link with the actual user profile
						const href =
							item.href === '/profile/me' && profile ? `/profile/${profile.id}` : item.href;
						const isActive = pathname === href || pathname.startsWith(`${href}/`);
						return (
							<Link
								key={item.href}
								href={href}
								className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-14 transition-colors ${
									isActive ? 'text-neon-cyan' : 'text-text-muted'
								}`}
							>
								<span className="shrink-0">{item.icon}</span>
								<span className="text-[10px] font-mono">{item.label}</span>
							</Link>
						);
					})}

					{/* Three-dots menu for full nav */}
					<button
						type="button"
						onClick={() => setDrawerOpen(true)}
						className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-14 text-text-muted transition-colors"
					>
						<MoreHorizontal className="w-5 h-5" />
						<span className="text-[10px] font-mono">More</span>
					</button>
				</div>
			</nav>

			{/* Full drawer */}
			<AnimatePresence>
				{drawerOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-50 bg-void/70 backdrop-blur-sm lg:hidden"
							onClick={() => setDrawerOpen(false)}
						/>

						{/* Drawer panel */}
						<motion.div
							initial={{ y: '100%' }}
							animate={{ y: 0 }}
							exit={{ y: '100%' }}
							transition={{ type: 'spring', damping: 25, stiffness: 300 }}
							className="fixed bottom-0 left-0 right-0 z-50 bg-base border-t border-border-hard max-h-[70vh] overflow-y-auto lg:hidden"
						>
							{/* Header */}
							<div className="flex items-center justify-between px-5 py-4 border-b border-border-hard sticky top-0 bg-base z-10">
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-neon-cyan animate-pulse" />
									<span className="font-mono text-tiny text-neon-cyan uppercase tracking-widest font-black">
										Navigation
									</span>
								</div>
								<button
									type="button"
									onClick={() => setDrawerOpen(false)}
									className="text-text-muted hover:text-text-primary transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							{/* Nav items */}
							<div className="py-2 px-3">
								{NAV_ITEMS.map((item) => {
									const href =
										item.href === '/profile/me' && profile ? `/profile/${profile.id}` : item.href;
									const isActive =
										pathname === href ||
										pathname.startsWith(`${href}/`) ||
										(item.href === '/profile/me' && pathname.startsWith('/profile/'));
									return (
										<Link
											key={item.href}
											href={href}
											onClick={() => setDrawerOpen(false)}
											className={`flex items-center gap-3 px-3 py-3 text-sm font-body transition-colors border-b border-border-hard/20 last:border-0 ${
												isActive ? 'text-neon-cyan bg-neon-cyan/5' : 'text-text-secondary'
											}`}
										>
											<span className="shrink-0 opacity-70">{item.icon}</span>
											<span>{item.label}</span>
										</Link>
									);
								})}
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}
