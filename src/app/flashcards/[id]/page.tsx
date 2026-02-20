'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlashcardStudy, type StudyCard } from '@/components/flashcards/FlashcardStudy';
import { SessionComplete, type SessionStats } from '@/components/flashcards/SessionComplete';

interface DeckInfo {
	id: number;
	title: string;
	description: string | null;
	card_count: number;
	tags: string[];
}

export default function FlashcardStudyPage() {
	const { id } = useParams<{ id: string }>();
	const [deck, setDeck] = useState<DeckInfo | null>(null);
	const [cards, setCards] = useState<StudyCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [phase, setPhase] = useState<'studying' | 'complete'>('studying');
	const [sessionStats, setSessionStats] = useState<SessionStats>({
		cardsReviewed: 0,
		gotIt: 0,
		needsReview: 0,
		startTime: Date.now(),
		xpEarned: 0,
	});
	const [queue, setQueue] = useState<StudyCard[]>([]);

	useEffect(() => {
		async function load() {
			try {
				const [deckRes, cardsRes] = await Promise.all([
					fetch(`/api/flashcards/decks/${id}`),
					fetch(`/api/flashcards/decks/${id}/cards`),
				]);
				const [deckData, cardsData] = await Promise.all([deckRes.json(), cardsRes.json()]);
				setDeck(deckData.deck ?? null);
				const loadedCards: StudyCard[] = cardsData.cards ?? [];
				setCards(loadedCards);
				const needsStudy = loadedCards.filter((c) => c.user_status !== 'got_it');
				const unseen = needsStudy.filter((c) => c.user_status === 'unseen');
				const review = needsStudy.filter((c) => c.user_status === 'needs_review');
				setQueue([...unseen, ...review]);
				setSessionStats((s) => ({ ...s, startTime: Date.now() }));
			} catch (err) {
				console.error('[Flashcards] Failed to fetch flashcard deck:', err);
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [id]);

	const masteredCount = useMemo(() => {
		const alreadyMastered = cards.filter((c) => c.user_status === 'got_it').length;
		return alreadyMastered + sessionStats.gotIt;
	}, [cards, sessionStats.gotIt]);

	const totalCards = cards.length;
	const progressPct = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

	const handleMark = useCallback(
		(status: 'got_it' | 'needs_review') => {
			const currentCard = queue[currentIndex];
			if (!currentCard) return;

			// Update server
			fetch('/api/flashcards/progress', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ card_id: currentCard.id, status }),
			})
				.then((r) => r.json())
				.then((data) => {
					if (data.xp_earned > 0) {
						setSessionStats((s) => ({ ...s, xpEarned: s.xpEarned + data.xp_earned }));
					}
				})
				.catch(() => {});

			setSessionStats((s) => ({
				...s,
				cardsReviewed: s.cardsReviewed + 1,
				gotIt: status === 'got_it' ? s.gotIt + 1 : s.gotIt,
				needsReview: status === 'needs_review' ? s.needsReview + 1 : s.needsReview,
			}));

			if (status === 'needs_review') {
				const newQueue = [...queue];
				const card = newQueue.splice(currentIndex, 1)[0];
				newQueue.push(card);
				setQueue(newQueue);
				if (currentIndex >= newQueue.length) setCurrentIndex(0);
			} else {
				const newQueue = queue.filter((_, i) => i !== currentIndex);
				setQueue(newQueue);
				if (newQueue.length === 0) setPhase('complete');
				else if (currentIndex >= newQueue.length) setCurrentIndex(0);
			}
		},
		[currentIndex, queue],
	);

	const handleReviewAgain = useCallback(() => {
		const reviewCards = cards.filter((c) => c.user_status === 'needs_review');
		if (reviewCards.length > 0) {
			setQueue(reviewCards);
			setCurrentIndex(0);
			setPhase('studying');
			setSessionStats({
				cardsReviewed: 0,
				gotIt: 0,
				needsReview: 0,
				startTime: Date.now(),
				xpEarned: 0,
			});
		}
	}, [cards]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
			</div>
		);
	}

	if (!deck) {
		return (
			<div className="text-center py-20">
				<p className="text-text-muted font-mono text-sm">Deck not found</p>
				<Link href="/flashcards" className="text-neon-cyan font-mono text-sm mt-2 inline-block">
					← Back to decks
				</Link>
			</div>
		);
	}

	if (phase === 'complete') {
		return (
			<SessionComplete
				deckTitle={deck.title}
				stats={sessionStats}
				masteredCount={masteredCount}
				totalCards={totalCards}
				onReviewAgain={handleReviewAgain}
			/>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[600px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-neon-cyan/3 rounded-full blur-[120px] pointer-events-none" />

			{/* BACK + TITLE */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="flex items-center gap-3 mb-4"
			>
				<Link
					href="/flashcards"
					className="p-2 border border-border-hard hover:border-neon-cyan/50 transition-colors"
				>
					<ArrowLeft className="w-4 h-4 text-text-muted" />
				</Link>
				<div className="min-w-0">
					<h1 className="font-heading text-lg font-black text-text-primary uppercase tracking-tighter truncate">
						{deck.title}
					</h1>
					<p className="text-text-dim font-mono text-tiny uppercase tracking-widest font-bold">
						{queue.length} cards remaining
					</p>
				</div>
			</motion.div>

			{/* PROGRESS BAR */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.1 }}
				className="mb-6"
			>
				<div className="flex items-center justify-between mb-1">
					<span className="dash-sub">Progress</span>
					<span className="font-mono text-tiny font-bold text-neon-cyan">
						{masteredCount}/{totalCards}
					</span>
				</div>
				<div className="h-1.5 bg-void rounded-full overflow-hidden">
					<motion.div
						animate={{ width: `${progressPct}%` }}
						transition={{ duration: 0.4 }}
						className="h-full bg-neon-cyan"
					/>
				</div>
			</motion.div>

			{/* FLASHCARD STUDY */}
			<FlashcardStudy queue={queue} currentIndex={currentIndex} onMark={handleMark} />

			{/* CARD COUNTER */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className="mt-4 flex items-center justify-center gap-3 text-text-dim font-mono text-tiny uppercase tracking-widest"
			>
				<span>
					Card {currentIndex + 1} / {queue.length}
				</span>
				<span>·</span>
				<span className="text-neon-green">{sessionStats.gotIt} mastered</span>
				{sessionStats.needsReview > 0 && (
					<>
						<span>·</span>
						<span className="text-neon-orange">{sessionStats.needsReview} reviewing</span>
					</>
				)}
			</motion.div>
		</div>
	);
}
