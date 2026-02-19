"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { ADMIN_NAV_ITEMS, NAV_ITEMS } from "@/lib/utils/navIcons";

export default function Sidebar() {
	const pathname = usePathname();
	const { isAdmin, profile } = useAuthContext();

	return (
		<aside className="hidden lg:flex flex-col w-56 min-h-[calc(100vh-4rem)] bg-base border-r border-border-hard shrink-0">
			{/* Profile summary card */}
			{profile && (
				<div className="px-4 py-4 border-b border-border-hard space-y-2">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-base font-mono font-black text-neon-cyan">
							{profile.display_name.charAt(0).toUpperCase()}
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-mono font-bold text-text-primary truncate">
								{profile.display_name}
							</p>
							<p className="text-tiny font-mono text-text-muted uppercase tracking-widest">
								Roll #{String(profile.roll_number).padStart(2, "0")}
							</p>
						</div>
					</div>
					{/* Streak indicator */}
					{profile.current_streak > 0 && (
						<div className="flex items-center gap-1.5 px-2 py-1 bg-neon-orange/5 border border-neon-orange/20">
							<Flame className="w-3.5 h-3.5 text-neon-orange" />
							<span className="font-mono text-tiny text-neon-orange font-black">
								{profile.current_streak}d streak
							</span>
						</div>
					)}
				</div>
			)}

			<nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
				{NAV_ITEMS.map((item) => {
					const isActive =
						pathname === item.href || pathname.startsWith(`${item.href}/`);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex items-center gap-3 px-3 py-2.5 text-sm font-body rounded-brutal-sm transition-all duration-150 ${
								isActive
									? "bg-neon-cyan/10 text-neon-cyan border-l-[3px] border-neon-cyan -ml-px"
									: "text-text-secondary hover:text-text-primary hover:bg-elevated"
							}`}
						>
							<span className="shrink-0 opacity-70">{item.icon}</span>
							<span>{item.label}</span>
						</Link>
					);
				})}

				{/* Admin section */}
				{isAdmin && (
					<>
						<div className="pt-4 mt-4 border-t border-border-hard">
							<p className="px-3 text-[10px] font-mono text-neon-magenta/60 uppercase tracking-widest mb-2 font-black">
								:: Admin
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
											? "bg-neon-magenta/10 text-neon-magenta border-l-[3px] border-neon-magenta -ml-px"
											: "text-text-secondary hover:text-text-primary hover:bg-elevated"
									}`}
								>
									<span className="shrink-0 opacity-70">{item.icon}</span>
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
