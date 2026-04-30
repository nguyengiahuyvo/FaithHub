const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const admin = require('firebase-admin');

const serviceAccount = require('./adminkey.json');
const DEFAULT_QUESTIONS_FILE = path.join('questions', 'questions.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

function parseArgs(argv) {
	const args = {
		filePath: DEFAULT_QUESTIONS_FILE,
		mergeById: false,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		if (token === '--file') args.filePath = argv[i + 1];
		if (token === '--mergeById') args.mergeById = true;
	}

	return args;
}

function loadQuestions(filePath) {
	const absolutePath = path.resolve(process.cwd(), filePath);

	if (!fs.existsSync(absolutePath)) {
		throw new Error(
			`Questions file not found: ${absolutePath}. Create it or pass --file <path>.`
		);
	}

	let raw = fs.readFileSync(absolutePath, 'utf8');
	// Allow `(randomUUID)` placeholder for `id`. Replace with `null` so the file
	// is valid JSON; the script then generates a UUID for any null/missing id.
	raw = raw.replace(/\(randomUUID\)/g, 'null');

	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		// Forgive trailing commas.
		const normalized = raw.replace(/,\s*([}\]])/g, '$1');
		parsed = JSON.parse(normalized);
	}

	if (!Array.isArray(parsed)) {
		throw new Error('Questions file must contain a JSON array.');
	}

	return parsed;
}

function isValidTranslation(t) {
	if (!t || typeof t !== 'object') return false;
	if (typeof t.q !== 'string' || !t.q.trim()) return false;
	if (!Array.isArray(t.choices) || t.choices.length !== 4) return false;
	return t.choices.every((c) => typeof c === 'string' && c.trim());
}

function validateQuestion(q, idx) {
	if (!q || typeof q !== 'object' || Array.isArray(q)) {
		throw new Error(`Question at index ${idx} must be an object.`);
	}
	if (!q.translations || typeof q.translations !== 'object') {
		throw new Error(`Question at index ${idx} is missing 'translations'.`);
	}

	const langs = Object.keys(q.translations);
	if (langs.length === 0) {
		throw new Error(`Question at index ${idx} has empty 'translations'.`);
	}
	for (const l of langs) {
		if (!isValidTranslation(q.translations[l])) {
			throw new Error(
				`Question at index ${idx} has invalid translation for '${l}' (need q + 4 non-empty choices).`
			);
		}
	}

	if (
		!Number.isInteger(q.answer) ||
		q.answer < 0 ||
		q.answer >= q.translations[langs[0]].choices.length
	) {
		throw new Error(`Question at index ${idx} must have an integer 'answer' within choice range.`);
	}
}

function buildTranslations(rawTranslations) {
	const out = {};
	for (const [l, t] of Object.entries(rawTranslations)) {
		const entry = {
			q: t.q.trim(),
			choices: t.choices.map((c) => c.trim()),
		};
		if (typeof t.successMsg === 'string' && t.successMsg.trim()) {
			entry.successMsg = t.successMsg.trim();
		}
		if (typeof t.failMsg === 'string' && t.failMsg.trim()) {
			entry.failMsg = t.failMsg.trim();
		}
		out[l] = entry;
	}
	return out;
}

function buildReference(rawReference) {
	if (!rawReference || typeof rawReference !== 'object') return null;
	const out = {};
	for (const [l, r] of Object.entries(rawReference)) {
		if (typeof r === 'string' && r.trim()) {
			out[l] = r.trim();
		}
	}
	return Object.keys(out).length > 0 ? out : null;
}

function toFirestorePayload(question) {
	const payload = {
		answer: question.answer,
		translations: buildTranslations(question.translations),
		answeredUsers: {},
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
	};

	const reference = buildReference(question.reference);
	if (reference) payload.reference = reference;

	return payload;
}

async function uploadQuestions({ questions, mergeById }) {
	const baseRef = db.collection('questions');

	let batch = db.batch();
	let operationsInBatch = 0;
	let totalUploaded = 0;

	for (let i = 0; i < questions.length; i += 1) {
		validateQuestion(questions[i], i);

		const payload = toFirestorePayload(questions[i]);
		const rawId = questions[i].id;
		const customId = typeof rawId === 'string' && rawId.trim() ? rawId.trim() : null;
		const docId = customId || randomUUID();
		const docRef = baseRef.doc(docId);

		if (mergeById && customId) {
			batch.set(docRef, payload, { merge: true });
		} else {
			batch.set(docRef, payload);
		}

		operationsInBatch += 1;
		totalUploaded += 1;

		if (operationsInBatch === 450) {
			await batch.commit();
			batch = db.batch();
			operationsInBatch = 0;
		}
	}

	if (operationsInBatch > 0) {
		await batch.commit();
	}

	return totalUploaded;
}

async function main() {
	try {
		const args = parseArgs(process.argv.slice(2));
		const questions = loadQuestions(args.filePath);
		const uploadedCount = await uploadQuestions({
			questions,
			mergeById: args.mergeById,
		});

		console.log(`Uploaded ${uploadedCount} questions to /questions`);
		process.exit(0);
	} catch (err) {
		console.error('Upload failed:', err.message);
		process.exit(1);
	}
}

main();
