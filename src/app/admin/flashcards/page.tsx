'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Edit3, Eye, Layers, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';

interface Deck {
	id: number;
	title: string;
	description: string | null;
	tags: string[];
	card_count: number;
	created_at: string;
}

export default function AdminFlashcardsPage() {
	const { isAdmin } = useAuthContext();
	const [decks, setDecks] = useState<Deck[]>([]);
	const [loading, setLoading] = useState(true);

	// Upload form state
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [tagsInput, setTagsInput] = useState('');
	const [csvContent, setCsvContent] = useState('');
	const [preview, setPreview] = useState<{ front: string; back: string }[]>([]);
	const [uploading, setUploading] = useState(false);
	const [uploadMsg, setUploadMsg] = useState('');

	// Edit modal
	const [editDeck, setEditDeck] = useState<Deck | null>(null);
	const [editTitle, setEditTitle] = useState('');
	const [editDesc, setEditDesc] = useState('');
	const [editTags, setEditTags] = useState('');
	const [saving, setSaving] = useState(false);

	async function loadDecks() {
		try {
			const res = await fetch('/api/flashcards/decks');
			const data = await res.json();
			setDecks(data.decks ?? []);
		} catch (err) {
			console.error('[AdminFlashcards] Failed to fetch decks:', err);
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		loadDecks();
	}, []);

	// Parse CSV for preview
	function parsePreview(csv: string) {
		const lines = csv.split(/\r?\n/).filter((l) => l.trim());
		const parsed: { front: string; back: string }[] = [];
		for (const line of lines) {
			// Simple split, the server does robust parsing anyway
			const match = line.match(/^"?([^"]*)"?\s*,\s*"?([^"]*)"?$/);
			if (match) {
				parsed.push({ front: match[1], back: match[2] });
			} else {
				const parts = line.split(',');
				if (parts.length >= 2) {
					parsed.push({
						front: parts[0].replace(/^"|"$/g, '').trim(),
						back: parts.slice(1).join(',').replace(/^"|"$/g, '').trim(),
					});
				}
			}
		}
		return parsed;
	}

	function handleCsvChange(value: string) {
		setCsvContent(value);
		setPreview(parsePreview(value));
	}

	function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result as string;
			setCsvContent(text);
			setPreview(parsePreview(text));
		};
		reader.readAsText(file);
	}

	async function handleUpload() {
		if (!title.trim() || !csvContent.trim()) return;
		setUploading(true);
		setUploadMsg('');
		try {
			const tags = tagsInput
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
			const res = await fetch('/api/flashcards/decks/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, description, tags, csv_content: csvContent }),
			});
			const data = await res.json();
			if (res.ok) {
				setUploadMsg(`✅ Created "${title}" with ${data.cards_created} cards`);
				setTitle('');
				setDescription('');
				setTagsInput('');
				setCsvContent('');
				setPreview([]);
				loadDecks();
			} else {
				setUploadMsg(`❌ ${data.error}`);
			}
		} catch {
			setUploadMsg('❌ Upload failed');
		} finally {
			setUploading(false);
		}
	}

	async function handleDelete(deckId: number) {
		if (!confirm('Delete this deck and all its cards?')) return;
		try {
			await fetch(`/api/flashcards/decks/${deckId}`, { method: 'DELETE' });
			loadDecks();
		} catch (err) {
			console.error('[AdminFlashcards] Failed to save deck:', err);
		}
	}

	function openEdit(deck: Deck) {
		setEditDeck(deck);
		setEditTitle(deck.title);
		setEditDesc(deck.description ?? '');
		setEditTags(deck.tags.join(', '));
	}

	async function saveEdit() {
		if (!editDeck) return;
		setSaving(true);
		try {
			const tags = editTags
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
			await fetch(`/api/flashcards/decks/${editDeck.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: editTitle, description: editDesc, tags }),
			});
			setEditDeck(null);
			loadDecks();
		} catch (err) {
			console.error('[AdminFlashcards] Failed to delete deck:', err);
		} finally {
			setSaving(false);
		}
	}

	if (!isAdmin) {
		return (
			<div className="text-center py-20">
				<p className="text-text-muted font-mono text-sm">Admin access required</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-magenta/20 border-t-neon-magenta animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[900px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-magenta/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-magenta pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-magenta">::</span> Manage Flashcards
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Upload · Edit · Manage Decks
				</p>
			</motion.header>

			{/* UPLOAD SECTION */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="card-brutal scifi-window p-0 overflow-hidden mb-8 relative group"
			>
				<div className="card-overlay" />
				<div
					className="corner-deco corner-tl"
					style={{ borderColor: 'var(--color-neon-magenta)' }}
				/>
				<div
					className="corner-deco corner-tr"
					style={{ borderColor: 'var(--color-neon-magenta)' }}
				/>
				<div
					className="corner-deco corner-bl"
					style={{ borderColor: 'var(--color-neon-magenta)' }}
				/>
				<div
					className="corner-deco corner-br"
					style={{ borderColor: 'var(--color-neon-magenta)' }}
				/>

				<div className="terminal-bar">
					<div className="flex items-center gap-3">
						<div className="traffic-lights">
							<div className="status-dot status-dot-red" />
							<div className="status-dot status-dot-yellow" />
							<div className="status-dot status-dot-green" />
						</div>
						<span className="scifi-label" style={{ color: 'var(--color-neon-magenta)' }}>
							:: Upload New Deck
						</span>
					</div>
				</div>

				<div className="p-6 relative z-10 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label htmlFor="deck-title" className="form-label mb-1.5 block">
								Title *
							</label>
							<input
								id="deck-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Segment Tree Concepts"
								className="form-input py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="deck-tags" className="form-label mb-1.5 block">
								Tags (comma-separated)
							</label>
							<input
								id="deck-tags"
								value={tagsInput}
								onChange={(e) => setTagsInput(e.target.value)}
								placeholder="e.g. dp, trees, math"
								className="form-input py-2.5 text-sm"
							/>
						</div>
					</div>

					<div>
						<label htmlFor="deck-desc" className="form-label mb-1.5 block">
							Description
						</label>
						<input
							id="deck-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Brief description of this deck"
							className="form-input py-2.5 text-sm"
						/>
					</div>

					<div>
						<div className="flex items-center justify-between mb-1.5">
							<label htmlFor="csv-content" className="form-label">
								CSV Content *
							</label>
							<label
								htmlFor="csv-file"
								className="flex items-center gap-1.5 px-3 py-1 border border-border-hard text-text-muted font-mono text-tiny uppercase tracking-widest font-bold cursor-pointer hover:text-text-secondary hover:border-neon-magenta/40 transition-colors"
							>
								<Upload className="w-3 h-3" /> Upload .csv
								<input
									id="csv-file"
									type="file"
									accept=".csv"
									onChange={handleFileUpload}
									className="hidden"
								/>
							</label>
						</div>
						<textarea
							id="csv-content"
							value={csvContent}
							onChange={(e) => handleCsvChange(e.target.value)}
							placeholder={'"What is DP?","Dynamic Programming is..."'}
							rows={6}
							className="form-input py-2.5 text-sm font-mono resize-y"
						/>
					</div>

					{/* PREVIEW */}
					{preview.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<Eye className="w-3.5 h-3.5 text-text-dim" />
								<span className="dash-sub">Preview: {preview.length} cards parsed</span>
							</div>
							<div className="border border-border-hard divide-y divide-border-hard max-h-48 overflow-y-auto">
								{preview.slice(0, 5).map((c, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: TODO: fix this
									<div key={i} className="flex gap-4 p-3 text-sm font-mono">
										<span className="text-neon-cyan shrink-0 w-6 text-right">{i + 1}.</span>
										<span className="text-text-primary flex-1 truncate">{c.front}</span>
										<span className="text-text-dim">→</span>
										<span className="text-text-secondary flex-1 truncate">{c.back}</span>
									</div>
								))}
								{preview.length > 5 && (
									<div className="p-2 text-center text-text-dim font-mono text-tiny">
										...and {preview.length - 5} more
									</div>
								)}
							</div>
						</div>
					)}

					{/* Upload message */}
					{uploadMsg && <p className="font-mono text-sm text-text-secondary">{uploadMsg}</p>}

					<button
						type="button"
						onClick={handleUpload}
						disabled={!title.trim() || !csvContent.trim() || uploading}
						className="btn-neon px-6 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
						style={{
							background: 'var(--color-neon-magenta)',
							borderColor: '#000',
						}}
					>
						<Plus className="w-4 h-4" />
						{uploading ? 'Uploading...' : 'Create Deck'}
					</button>
				</div>
			</motion.div>

			{/* EXISTING DECKS */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<h3 className="dash-heading mb-4">
					<Layers className="w-4 h-4 text-neon-magenta opacity-50" /> Existing Decks ({decks.length}
					)
				</h3>

				{decks.length === 0 ? (
					<p className="text-text-dim font-mono text-sm">No decks yet. Upload one above.</p>
				) : (
					<div className="space-y-2">
						{decks.map((deck) => (
							<div key={deck.id} className="card-brutal p-4 flex items-center gap-4">
								<div className="flex-1 min-w-0">
									<h4 className="font-heading font-bold text-text-primary truncate">
										{deck.title}
									</h4>
									<div className="flex items-center gap-3 mt-0.5">
										<span className="dash-sub">{deck.card_count} cards</span>
										{deck.tags.length > 0 && (
											<div className="flex gap-1">
												{deck.tags.map((t) => (
													<span
														key={t}
														className="px-1.5 py-0.5 bg-neon-magenta/5 border border-neon-magenta/20 text-neon-magenta font-mono text-micro uppercase"
													>
														{t}
													</span>
												))}
											</div>
										)}
									</div>
								</div>

								<button
									type="button"
									onClick={() => openEdit(deck)}
									className="p-2 border border-border-hard text-text-muted hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors"
									title="Edit"
								>
									<Edit3 className="w-4 h-4" />
								</button>
								<button
									type="button"
									onClick={() => handleDelete(deck.id)}
									className="p-2 border border-border-hard text-text-muted hover:text-neon-red hover:border-neon-red/40 transition-colors"
									title="Delete"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				)}
			</motion.div>

			{/* EDIT MODAL */}
			<AnimatePresence>
				{editDeck && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4"
						onClick={() => setEditDeck(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="card-brutal p-6 w-full max-w-md relative"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								onClick={() => setEditDeck(null)}
								className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
							>
								<X className="w-4 h-4" />
							</button>

							<h3 className="font-heading font-black text-lg text-text-primary uppercase tracking-tighter mb-4">
								Edit Deck
							</h3>

							<div className="space-y-3">
								<div>
									<label htmlFor="edit-title" className="form-label mb-1 block">
										Title
									</label>
									<input
										id="edit-title"
										value={editTitle}
										onChange={(e) => setEditTitle(e.target.value)}
										className="form-input py-2.5 text-sm"
									/>
								</div>
								<div>
									<label htmlFor="edit-desc" className="form-label mb-1 block">
										Description
									</label>
									<input
										id="edit-desc"
										value={editDesc}
										onChange={(e) => setEditDesc(e.target.value)}
										className="form-input py-2.5 text-sm"
									/>
								</div>
								<div>
									<label htmlFor="edit-tags" className="form-label mb-1 block">
										Tags (comma-separated)
									</label>
									<input
										id="edit-tags"
										value={editTags}
										onChange={(e) => setEditTags(e.target.value)}
										className="form-input py-2.5 text-sm"
									/>
								</div>
							</div>

							<div className="flex gap-3 mt-5">
								<button
									type="button"
									onClick={() => setEditDeck(null)}
									className="btn-brutal px-4 py-2"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={saveEdit}
									disabled={saving}
									className="btn-neon px-4 py-2 flex-1"
									style={{
										background: 'var(--color-neon-magenta)',
										borderColor: '#000',
									}}
								>
									{saving ? 'Saving...' : 'Save'}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
