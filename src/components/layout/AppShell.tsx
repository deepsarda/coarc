'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import MobileNav from '@/components/layout/MobileNav';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

// Routes where we hide the app chrome (navbar, sidebar, mobile nav)
const CHROMELESS_ROUTES = ['/login', '/setup'];

export default function AppShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const isChromeless = CHROMELESS_ROUTES.includes(pathname);

	if (isChromeless) {
		return <>{children}</>;
	}

	return (
		<>
			<Navbar />
			<div className="flex">
				{/* Ignore on landing page */}
				{pathname !== '/' && <Sidebar />}
				<main className="flex-1 min-h-[calc(100vh-4rem)] pb-20 lg:pb-0 w-full max-w-full overflow-x-hidden">
					{children}
				</main>
			</div>
			<MobileNav />
		</>
	);
}
