'use client';

import { type ReactNode, useCallback, useEffect } from 'react';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		},
		[onClose],
	);

	useEffect(() => {
		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown);
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = '';
		};
	}, [isOpen, handleKeyDown]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled via useEffect */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay is interactive by design */}
			<div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} />
			{/* Modal */}
			<div
				className={`relative card-brutal w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up ${className}`}
			>
				{title && (
					<div className="flex items-center justify-between px-5 py-4 border-b-3 border-border-hard">
						<h2 className="font-heading font-bold text-text-primary text-lg">{title}</h2>
						<button
							type="button"
							onClick={onClose}
							className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none"
						>
							✕
						</button>
					</div>
				)}
				<div className="p-5">{children}</div>
			</div>
		</div>
	);
}
