import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';
import { AuthProvider } from '@/components/providers/AuthProvider';
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
	icons: {
		icon: '/icon-192.png',
		apple: '/icon-192.png',
	},
	manifest: '/manifest.json',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: SITE.name,
	},
};

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: '#0a0e17',
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
					<AuthProvider>
						<AppShell>{children}</AppShell>
						<NotificationPrompt />
					</AuthProvider>
				</ToastProvider>
			</body>
		</html>
	);
}
