'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
	const pathname = usePathname();
	const { user, signOut, loading } = useAuth();

	// Don't show navbar on public pages
	if (['/', '/login', '/setup'].includes(pathname)) return null;

	return (
		<header className="sticky top-0 z-40 bg-void/80 backdrop-blur-md border-b border-white/5">
			<div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
				{/* Logo */}
				<Link
					href="/dashboard"
					className="font-mono text-lg font-bold text-text-primary tracking-tight group"
				>
					<span className="text-neon-cyan">co</span>
					<span className="text-text-primary">.</span>
					<span className="text-text-secondary font-light">arc</span>
				</Link>

				{/* Right side */}
				<div className="flex items-center gap-3">
					{/* Notification bell placeholder */}
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

					{/* Profile / Sign out */}
					{user && !loading && (
						<button
							type="button"
							onClick={signOut}
							className="text-text-muted hover:text-text-primary text-xs font-mono transition-colors"
						>
							Sign out
						</button>
					)}
				</div>
			</div>
		</header>
	);
}
