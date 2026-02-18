interface SpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

const sizeClasses = {
	sm: 'w-4 h-4 border-2',
	md: 'w-8 h-8 border-3',
	lg: 'w-12 h-12 border-3',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
	return (
		<div
			className={`${sizeClasses[size]} border-neon-cyan border-t-transparent rounded-full animate-spin ${className}`}
			role="status"
		>
			<span className="sr-only">Loading...</span>
		</div>
	);
}
