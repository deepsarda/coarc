import type { ReactNode } from 'react';

type BadgeVariant = 'neon' | 'muted' | 'danger' | 'success' | 'warning';

interface BadgeProps {
	children: ReactNode;
	variant?: BadgeVariant;
	className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
	neon: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
	muted: 'bg-elevated text-text-secondary border-border-hard',
	danger: 'bg-neon-red/10 text-neon-red border-neon-red/30',
	success: 'bg-neon-green/10 text-neon-green border-neon-green/30',
	warning: 'bg-neon-orange/10 text-neon-orange border-neon-orange/30',
};

export default function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold border rounded-brutal-sm ${variantClasses[variant]} ${className}`}
		>
			{children}
		</span>
	);
}
