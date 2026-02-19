'use client';

import { useEffect, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';

export default function EncryptedText({
	text,
	scrambling = false,
}: {
	text: string;
	scrambling?: boolean;
}) {
	const [display, setDisplay] = useState(text);

	useEffect(() => {
		if (!scrambling) {
			// Just show nonsense once
			setDisplay(
				text
					.split('')
					.map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
					.join(''),
			);
			return;
		}

		const interval = setInterval(() => {
			setDisplay(
				text
					.split('')
					.map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
					.join(''),
			);
		}, 100);

		return () => clearInterval(interval);
	}, [text, scrambling]);

	return <span>{display}</span>;
}
