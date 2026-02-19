import type { ReactNode } from 'react';

interface CardProps {
	children: ReactNode;
	title?: string;
	footer?: ReactNode;
	glow?: boolean;
	className?: string;
}

export default function Card({ children, title, footer, glow, className = '' }: CardProps) {
	return (
		<div
			className={`card-brutal scifi-window p-0 overflow-hidden relative group transition-all duration-300 ${glow ? 'border-neon-cyan/40 bg-neon-cyan/[0.02]' : ''} ${className}`}
		>
			{/* Component Corner Decorations */}
			<div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-cyan opacity-40 z-20 group-hover:opacity-100 transition-opacity" />
			<div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-cyan opacity-0 z-20 group-hover:opacity-40 transition-opacity" />
			<div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-cyan opacity-0 z-20 group-hover:opacity-40 transition-opacity" />
			<div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-cyan opacity-40 z-20 group-hover:opacity-100 transition-opacity" />

			{title && (
				<div className="px-5 py-2.5 border-b border-border-hard bg-zinc-950/80 backdrop-blur-md relative z-10">
					<div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
					<h3 className="font-mono font-black text-text-primary text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
						<span className="text-neon-cyan">::</span> {title}
					</h3>
				</div>
			)}

			<div className="p-6 relative z-10">{children}</div>

			{footer && (
				<div className="px-5 py-2.5 border-t border-border-hard bg-zinc-950/40 relative z-10">
					<div className="font-mono text-[9px] uppercase tracking-widest text-text-muted font-bold">
						{footer}
					</div>
				</div>
			)}
		</div>
	);
}
