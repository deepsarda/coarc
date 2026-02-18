'use client';

import { type ReactNode, useState } from 'react';

interface TooltipProps {
	children: ReactNode;
	content: string;
	className?: string;
}

export default function Tooltip({ children, content, className = '' }: TooltipProps) {
	const [show, setShow] = useState(false);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: tooltip trigger wrapper
		<div
			className={`relative inline-block ${className}`}
			onMouseEnter={() => setShow(true)}
			onMouseLeave={() => setShow(false)}
			onFocus={() => setShow(true)}
			onBlur={() => setShow(false)}
		>
			{children}
			{show && (
				<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-elevated border-2 border-border-hard text-text-primary text-xs font-mono whitespace-nowrap shadow-brutal-sm z-50 animate-slide-up">
					{content}
				</div>
			)}
		</div>
	);
}
