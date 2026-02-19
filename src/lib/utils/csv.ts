/**
 * Simple CSV parser for flashcard uploads.
 * Handles quoted fields and commas within quotes.
 * Expected format: "question","answer" per line
 */
export function parseCSV(content: string): { front: string; back: string }[] {
	const lines = content.split(/\r?\n/).filter((l) => l.trim());
	const results: { front: string; back: string }[] = [];

	for (const line of lines) {
		const fields = parseCSVLine(line);
		if (fields.length >= 2) {
			results.push({
				front: fields[0].trim(),
				back: fields[1].trim(),
			});
		}
	}

	return results;
}

function parseCSVLine(line: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i];

		if (inQuotes) {
			if (char === '"') {
				// Check for escaped quote ("")
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i += 2;
					continue;
				}
				// End of quoted field
				inQuotes = false;
				i++;
				continue;
			}
			current += char;
			i++;
		} else {
			if (char === '"') {
				inQuotes = true;
				i++;
				continue;
			}
			if (char === ",") {
				fields.push(current);
				current = "";
				i++;
				continue;
			}
			current += char;
			i++;
		}
	}

	fields.push(current);
	return fields;
}
