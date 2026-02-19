"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { MOBILE_NAV_ITEMS } from "@/lib/utils/constants";

export default function MobileNav() {
	const pathname = usePathname();
	const { profile } = useAuthContext();

	return (
		<nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-base/95 backdrop-blur-md border-t border-border-hard">
			<div className="flex items-center justify-around h-16 px-2">
				{MOBILE_NAV_ITEMS.map((item) => {
					// Replace the profile link with the actual user profile
					const href =
						item.href === "/profile/me" && profile
							? `/profile/${profile.id}`
							: item.href;
					const isActive = pathname === href || pathname.startsWith(href + "/");
					return (
						<Link
							key={item.href}
							href={href}
							className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-[3.5rem] transition-colors ${
								isActive ? "text-neon-cyan" : "text-text-muted"
							}`}
						>
							<span className="text-xl">{item.icon}</span>
							<span className="text-[10px] font-mono">{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
