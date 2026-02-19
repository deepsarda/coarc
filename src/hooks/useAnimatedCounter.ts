"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated counter hook, counts from 0 to `end` over `duration` ms.
 */
export function useAnimatedCounter(
	end: number,
	duration = 1200,
	delay = 0,
): number {
	const [value, setValue] = useState(0);
	const rafRef = useRef<number>(0);

	useEffect(() => {
		if (end <= 0) {
			setValue(0);
			return;
		}

		const timeout = setTimeout(() => {
			const startTime = performance.now();

			const tick = (now: number) => {
				const elapsed = now - startTime;
				const progress = Math.min(elapsed / duration, 1);
				// easeOutExpo
				const eased = progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
				setValue(Math.round(eased * end));
				if (progress < 1) {
					rafRef.current = requestAnimationFrame(tick);
				}
			};

			rafRef.current = requestAnimationFrame(tick);
		}, delay);

		return () => {
			clearTimeout(timeout);
			cancelAnimationFrame(rafRef.current);
		};
	}, [end, duration, delay]);

	return value;
}
