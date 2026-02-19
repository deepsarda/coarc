'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getLevelForXP } from '@/lib/utils/constants';

export default function Navbar() {
	const { user, profile, loading, signOut } = useAuthContext();

	const pathname = usePathname();

	// Don't show navbar on specific pages
	if (['/login', '/setup'].includes(pathname)) return null;

	const levelInfo = profile ? getLevelForXP(profile.xp) : null;

	return (
		<header className="sticky top-0 z-40 bg-void/80 backdrop-blur-md border-b border-border-subtle">
			<div className="flex items-center justify-between px-4 md:px-6 h-16 max-w-full w-full">
				{/* Logo */}
				<Link
					href="/dashboard"
					className="font-mono text-lg font-bold text-text-primary tracking-tight group shrink-0"
				>
					<span className="text-neon-cyan">CO</span>
					<span className="text-text-primary">.</span>
					<span className="text-text-secondary font-light">ARC</span>
				</Link>

				{/* Right side */}
				<div className="flex items-center gap-2 md:gap-4">
					{/* Level badge */}
					{profile && levelInfo && (
						<div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-hard">
							<span className="font-mono text-tiny text-neon-cyan font-black uppercase tracking-widest">
								Lv.{levelInfo.level}
							</span>
							<span className="font-mono text-tiny text-text-muted font-bold uppercase tracking-wider">
								{levelInfo.title}
							</span>
						</div>
					)}

					{/* XP counter */}
					{profile && (
						<div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border-hard">
							<span className="text-tiny">⚡</span>
							<span className="font-mono text-tiny text-neon-cyan font-black tabular-nums">
								{profile.xp.toLocaleString()} XP
							</span>
						</div>
					)}

					{/* Notification bell */}
					<Link
						href="/notifications"
						className="relative p-2 text-text-secondary hover:text-neon-cyan transition-colors"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<title>Notifications</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							/>
						</svg>
						{/* Unread indicator */}
						<span className="absolute top-1 right-1 w-1.5 h-1.5 bg-neon-red rounded-none shadow-[0_0_8px_rgba(255,0,64,0.6)] animate-pulse" />
					</Link>

					{/* Profile info + sign out */}
					{user && !loading && (
						<div className="flex items-center gap-2 md:gap-3">
							{profile && (
								<Link
									href={`/profile/${profile.id}`}
									className="flex items-center gap-2 p-1.5 hover:bg-elevated transition-colors group"
								>
									<div className="w-7 h-7 bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-sm font-mono font-black text-neon-cyan group-hover:border-neon-cyan/50 transition-colors">
										{profile.display_name.charAt(0).toUpperCase()}
									</div>
									<span className="hidden lg:block text-xs font-mono text-text-secondary group-hover:text-text-primary transition-colors truncate max-w-[100px]">
										{profile.display_name}
									</span>
								</Link>
							)}
							<button
								type="button"
								onClick={signOut}
								className="text-text-muted hover:text-neon-red text-xs font-mono transition-colors px-2 py-1"
							>
								↳ out
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
