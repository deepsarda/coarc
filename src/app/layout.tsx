import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import MobileNav from '@/components/layout/MobileNav';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { SITE } from '@/lib/config';

const spaceGrotesk = Space_Grotesk({
	variable: '--font-heading',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
	variable: '--font-mono',
	subsets: ['latin'],
	weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
	title: `${SITE.name} • ${SITE.tagline}`,
	description: SITE.description,
	icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-body bg-void text-text-primary antialiased`}
			>
				<ToastProvider>
					<Navbar />
					<div className="flex">
						<Sidebar />
						<main className="flex-1 min-h-[calc(100vh-3.5rem)] pb-20 lg:pb-0">{children}</main>
					</div>
					<MobileNav />
				</ToastProvider>
			</body>
		</html>
	);
}
