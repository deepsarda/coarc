'use client';

import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface StudyCard {
	id: number;
	front: string;
	back: string;
	position: number;
	user_status: 'unseen' | 'got_it' | 'needs_review';
}

interface FlashcardStudyProps {
	queue: StudyCard[];
	currentIndex: number;
	onMark: (status: 'got_it' | 'needs_review') => void;
}

export function FlashcardStudy({ queue, currentIndex, onMark }: FlashcardStudyProps) {
	const [flipped, setFlipped] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);

	const currentCard = queue[currentIndex] ?? null;

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally re-trigger on card change
	useEffect(() => {
		setFlipped(false);
	}, [currentIndex, currentCard?.id]);

	// Swipe handling
	const x = useMotionValue(0);
	const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
	const leftOpacity = useTransform(x, [-200, -80, 0], [1, 0.5, 0]);
	const rightOpacity = useTransform(x, [0, 80, 200], [0, 0.5, 1]);

	const handleMark = useCallback(
		(status: 'got_it' | 'needs_review') => {
			setFlipped(false);
			onMark(status);
		},
		[onMark],
	);

	const handleSwipeEnd = useCallback(
		(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
			const threshold = 100;
			const vThreshold = 300;
			if (info.offset.x > threshold || (info.offset.x > 50 && info.velocity.x > vThreshold)) {
				if (flipped) handleMark('got_it');
				else setFlipped(true);
			} else if (
				info.offset.x < -threshold ||
				(info.offset.x < -50 && info.velocity.x < -vThreshold)
			) {
				if (flipped) handleMark('needs_review');
				else setFlipped(true);
			}
		},
		[flipped, handleMark],
	);

	// Keyboard controls
	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				if (!flipped) setFlipped(true);
			} else if (e.key === 'ArrowRight' || e.key === 'l') {
				if (flipped) handleMark('got_it');
			} else if (e.key === 'ArrowLeft' || e.key === 'h') {
				if (flipped) handleMark('needs_review');
			}
		}
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [flipped, handleMark]);

	if (!currentCard) return null;

	return (
		<>
			{/* CARD */}
			<div className="relative min-h-[320px] sm:min-h-[360px] mb-6 select-none">
				{/* Swipe indicators */}
				{flipped && (
					<>
						<motion.div
							style={{ opacity: leftOpacity }}
							className="absolute left-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
						>
							<div className="bg-neon-orange/20 border border-neon-orange/40 px-3 py-1.5 font-mono text-tiny font-bold text-neon-orange uppercase">
								Review
							</div>
						</motion.div>
						<motion.div
							style={{ opacity: rightOpacity }}
							className="absolute right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
						>
							<div className="bg-neon-green/20 border border-neon-green/40 px-3 py-1.5 font-mono text-tiny font-bold text-neon-green uppercase">
								Got it
							</div>
						</motion.div>
					</>
				)}

				<AnimatePresence mode="wait">
					<motion.div
						key={`${currentCard.id}-${currentIndex}`}
						ref={cardRef}
						style={{ x, rotate }}
						drag={flipped ? 'x' : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.8}
						onDragEnd={handleSwipeEnd}
						initial={{ opacity: 0, y: 30, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
						exit={{ opacity: 0, y: -20, scale: 0.95 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						onClick={() => !flipped && setFlipped(true)}
						className="cursor-pointer touch-pan-y"
					>
						<div
							className="relative w-full min-h-[320px] sm:min-h-[360px]"
							style={{ perspective: '1000px' }}
						>
							<motion.div
								animate={{ rotateY: flipped ? 180 : 0 }}
								transition={{ duration: 0.5, type: 'spring', damping: 20 }}
								className="relative w-full h-full"
								style={{ transformStyle: 'preserve-3d' }}
							>
								{/* FRONT */}
								<div
									className="absolute inset-0 card-brutal border-neon-cyan/30 p-6 sm:p-8 flex flex-col items-center justify-center min-h-[320px] sm:min-h-[360px]"
									style={{ backfaceVisibility: 'hidden' }}
								>
									<span className="dash-sub mb-4">Question</span>
									<p className="font-mono text-base sm:text-lg text-text-primary text-center leading-relaxed whitespace-pre-wrap">
										{currentCard.front}
									</p>
									<p className="text-text-dim font-mono text-tiny mt-6 uppercase tracking-widest">
										Tap to flip · Space / Enter
									</p>
								</div>

								{/* BACK */}
								<div
									className="absolute inset-0 card-brutal border-neon-green/30 p-6 sm:p-8 flex flex-col items-center justify-center min-h-[320px] sm:min-h-[360px]"
									style={{
										backfaceVisibility: 'hidden',
										transform: 'rotateY(180deg)',
									}}
								>
									<span className="dash-sub mb-4 text-neon-green">Answer</span>
									<p className="font-mono text-base sm:text-lg text-text-primary text-center leading-relaxed whitespace-pre-wrap">
										{currentCard.back}
									</p>
									<p className="text-text-dim font-mono text-tiny mt-6 uppercase tracking-widest">
										Swipe right = Got it · Left = Review
									</p>
								</div>
							</motion.div>
						</div>
					</motion.div>
				</AnimatePresence>
			</div>

			{/* BUTTON CONTROLS */}
			{flipped && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex gap-3 mb-4"
				>
					<button
						type="button"
						onClick={() => handleMark('needs_review')}
						className="flex-1 flex items-center justify-center gap-2 py-3.5 font-mono text-sm font-bold uppercase tracking-widest border border-neon-orange/40 text-neon-orange hover:bg-neon-orange/10 transition-colors"
					>
						<ChevronLeft className="w-4 h-4" /> Review
					</button>
					<button
						type="button"
						onClick={() => handleMark('got_it')}
						className="flex-1 flex items-center justify-center gap-2 py-3.5 font-mono text-sm font-bold uppercase tracking-widest border border-neon-green/40 text-neon-green hover:bg-neon-green/10 transition-colors"
					>
						Got It <ChevronRight className="w-4 h-4" />
					</button>
				</motion.div>
			)}

			{/* Tap hint when not flipped */}
			{!flipped && (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
					<button
						type="button"
						onClick={() => setFlipped(true)}
						className="btn-brutal px-6 py-3 flex items-center justify-center gap-2 mx-auto"
					>
						<Check className="w-4 h-4" /> Flip Card
					</button>
				</motion.div>
			)}
		</>
	);
}
