'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV_ITEMS, NAV_ITEMS } from '@/lib/utils/constants';

interface SidebarProps {
	isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
	const pathname = usePathname();

	// Don't show sidebar on public pages
	if (['/', '/login', '/setup'].includes(pathname)) return null;

	return (
		<aside className="hidden lg:flex flex-col w-56 min-h-[calc(100vh-3.5rem)] bg-base border-r-3 border-border-hard">
			<nav className="flex-1 py-4 px-2 space-y-1">
				{NAV_ITEMS.map((item) => {
					const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex items-center gap-3 px-3 py-2.5 text-sm font-body rounded-brutal-sm transition-all duration-150 ${
								isActive
									? 'bg-neon-cyan/10 text-neon-cyan border-l-3 border-neon-cyan -ml-px'
									: 'text-text-secondary hover:text-text-primary hover:bg-elevated'
							}`}
						>
							<span className="text-base">{item.icon}</span>
							<span>{item.label}</span>
						</Link>
					);
				})}

				{/* Admin section */}
				{isAdmin && (
					<>
						<div className="pt-4 mt-4 border-t border-border-hard">
							<p className="px-3 text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
								Admin
							</p>
						</div>
						{ADMIN_NAV_ITEMS.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center gap-3 px-3 py-2 text-sm font-body rounded-brutal-sm transition-all duration-150 ${
										isActive
											? 'bg-neon-magenta/10 text-neon-magenta border-l-3 border-neon-magenta -ml-px'
											: 'text-text-secondary hover:text-text-primary hover:bg-elevated'
									}`}
								>
									<span className="text-base">{item.icon}</span>
									<span>{item.label}</span>
								</Link>
							);
						})}
					</>
				)}
			</nav>
		</aside>
	);
}
