import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'brutal' | 'neon' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
	brutal: 'btn-brutal',
	neon: 'btn-neon',
	ghost:
		'font-mono font-bold text-[10px] uppercase tracking-widest border border-transparent text-text-secondary hover:text-text-primary hover:border-border-hard transition-all duration-200 cursor-pointer',
	danger: 'btn-brutal border-neon-red/50 text-neon-red hover:bg-neon-red hover:text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: 'px-3 py-1.5 text-xs',
	md: 'px-5 py-2.5 text-sm',
	lg: 'px-8 py-3 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ variant = 'brutal', size = 'md', loading, children, className = '', disabled, ...props },
		ref,
	) => {
		return (
			<button
				ref={ref}
				disabled={disabled || loading}
				className={`${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
					disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
				}`}
				{...props}
			>
				{loading ? (
					<span className="flex items-center gap-2">
						<span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
						{children}
					</span>
				) : (
					children
				)}
			</button>
		);
	},
);

Button.displayName = 'Button';
export default Button;
