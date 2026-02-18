'use client';

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

type ToastType = 'info' | 'success' | 'error' | 'xp';

interface Toast {
	id: number;
	type: ToastType;
	message: string;
	xpAmount?: number;
}

interface ToastContextType {
	showToast: (message: string, type?: ToastType, xpAmount?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback((message: string, type: ToastType = 'info', xpAmount?: number) => {
		const id = ++toastId;
		setToasts((prev) => [...prev, { id, type, message, xpAmount }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	}, []);

	const typeStyles: Record<ToastType, string> = {
		info: 'border-neon-cyan bg-neon-cyan/5',
		success: 'border-neon-green bg-neon-green/5',
		error: 'border-neon-red bg-neon-red/5',
		xp: 'border-neon-orange bg-neon-orange/5',
	};

	const typeIcons: Record<ToastType, string> = {
		info: 'ℹ️',
		success: '✅',
		error: '❌',
		xp: '⚡',
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={`pointer-events-auto border-l-4 ${typeStyles[toast.type]} bg-surface border-3 border-border-hard shadow-brutal px-4 py-3 animate-slide-up max-w-sm`}
					>
						<div className="flex items-center gap-2">
							<span>{typeIcons[toast.type]}</span>
							<span className="text-text-primary text-sm font-body">{toast.message}</span>
							{toast.type === 'xp' && toast.xpAmount && (
								<span className="text-neon-orange font-mono font-bold text-sm ml-auto">
									+{toast.xpAmount} XP
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) throw new Error('useToast must be used within ToastProvider');
	return context;
}
