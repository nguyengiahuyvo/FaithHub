const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const serviceAccount = require('./adminkey.json');
const DEFAULT_QUESTIONS_FILE = path.join('questions', 'questions.json');
const DEFAULT_CREATED_BY = 'system-import';

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function parseArgs(argv) {
	const args = {
		orgId: null,
		userId: null,
		filePath: DEFAULT_QUESTIONS_FILE,
		mergeById: false,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		if (token === '--orgId') args.orgId = argv[i + 1];
		if (token === '--userId') args.userId = argv[i + 1];
		if (token === '--file') args.filePath = argv[i + 1];
		if (token === '--mergeById') args.mergeById = true;
	}

	return args;
}

function assertRequiredArgs(args) {
	if (!args.orgId) {
		throw new Error(
			'Usage: node uploadQuestions.js --orgId <orgId> [--file <questions.json>] [--userId <uid>] [--mergeById]'
		);
	}
}

function loadQuestions(filePath) {
	const absolutePath = path.resolve(process.cwd(), filePath);

	if (!fs.existsSync(absolutePath)) {
		throw new Error(
			`Questions file not found: ${absolutePath}. Create it or pass --file <path>.`
		);
	}

	const raw = fs.readFileSync(absolutePath, 'utf8');
	const parsed = parseJsonWithTrailingCommaSupport(raw);

	if (!Array.isArray(parsed)) {
		throw new Error('Questions file must contain a JSON array.');
	}

	return parsed;
}

function parseJsonWithTrailingCommaSupport(raw) {
	try {
		return JSON.parse(raw);
	} catch (err) {
		const normalized = raw.replace(/,\s*([}\]])/g, '$1');
		return JSON.parse(normalized);
	}
}

function validateQuestion(question, index) {
	if (typeof question !== 'object' || question === null || Array.isArray(question)) {
		throw new Error(`Question at index ${index} must be an object.`);
	}

	const questionText =
		typeof question.q === 'string' && question.q.trim()
			? question.q
			: question.questionText;
	const options = Array.isArray(question.choices) ? question.choices : question.options;
	const answerIndex =
		typeof question.answer === 'number' ? question.answer : question.correctAnswerIndex;

	if (!questionText || typeof questionText !== 'string') {
		throw new Error(`Question at index ${index} is missing a valid q/questionText.`);
	}

	if (!Array.isArray(options) || options.length < 2) {
		throw new Error(`Question at index ${index} must have at least 2 choices/options.`);
	}

	options.forEach((opt, optionIndex) => {
		if (typeof opt !== 'string' || !opt.trim()) {
			throw new Error(
				`Question at index ${index} has invalid choice at index ${optionIndex}.`
			);
		}
	});

	if (
		typeof answerIndex !== 'number' ||
		!Number.isInteger(answerIndex) ||
		answerIndex < 0 ||
		answerIndex >= options.length
	) {
		throw new Error(
			`Question at index ${index} must have a valid integer answer/correctAnswerIndex within choices/options range.`
		);
	}
}

function normalizeAnsweredUsers(answeredUsers) {
	if (!answeredUsers) return {};

	if (Array.isArray(answeredUsers)) {
		return answeredUsers.reduce((acc, uid) => {
			if (typeof uid === 'string' && uid.trim()) {
				acc[uid] = true;
			}
			return acc;
		}, {});
	}

	if (typeof answeredUsers === 'object') {
		return answeredUsers;
	}

	return {};
}

function toTimestampOrNow(value) {
	if (typeof value === 'string' || value instanceof Date) {
		const date = new Date(value);
		if (!Number.isNaN(date.getTime())) {
			return admin.firestore.Timestamp.fromDate(date);
		}
	}

	if (value && typeof value.toDate === 'function') {
		return value;
	}

	return admin.firestore.FieldValue.serverTimestamp();
}

function toFirestorePayload(question, userId) {
	const q =
		typeof question.q === 'string' && question.q.trim()
			? question.q.trim()
			: question.questionText.trim();
	const choices = (Array.isArray(question.choices) ? question.choices : question.options).map((o) =>
		o.trim()
	);
	const answer = typeof question.answer === 'number' ? question.answer : question.correctAnswerIndex;
	const createdBy =
		typeof question.createdBy === 'string' && question.createdBy.trim()
			? question.createdBy.trim()
			: userId || DEFAULT_CREATED_BY;

	const payload = {
		q,
		choices,
		answer,
		createdBy,
		createdAt: toTimestampOrNow(question.createdAt),
		updatedAt: toTimestampOrNow(question.updatedAt),
		correctCount: typeof question.correctCount === 'number' ? question.correctCount : 0,
		wrongCount: typeof question.wrongCount === 'number' ? question.wrongCount : 0,
		answeredUsers: normalizeAnsweredUsers(question.answeredUsers),
	};

	if (question.ref === null || typeof question.ref === 'string') {
		payload.ref = question.ref;
	}

	const optionalStringFields = [
		'category',
		'difficulty',
		'verseReference',
		'explanation',
		'language',
		'successMsg',
		'failMsg',
		'createdByName',
	];
	optionalStringFields.forEach((field) => {
		if (typeof question[field] === 'string' && question[field].trim()) {
			payload[field] = question[field].trim();
		}
	});

	if (question.verseReference && !payload.ref) {
		payload.ref = question.verseReference;
	}

	if (question.translations && typeof question.translations === 'object') {
		payload.translations = question.translations;
	}

	return payload;
}

async function uploadQuestions({ orgId, userId, questions, mergeById }) {
	const baseRef = db.collection('organizations').doc(orgId).collection('questQuestions');

	let batch = db.batch();
	let operationsInBatch = 0;
	let totalUploaded = 0;

	for (let i = 0; i < questions.length; i += 1) {
		validateQuestion(questions[i], i);

		const payload = toFirestorePayload(questions[i], userId);
		const hasCustomId = typeof questions[i].id === 'string' && questions[i].id.trim();
		const docRef = hasCustomId ? baseRef.doc(questions[i].id.trim()) : baseRef.doc();

		if (mergeById && hasCustomId) {
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
		assertRequiredArgs(args);

		const questions = loadQuestions(args.filePath);
		const uploadedCount = await uploadQuestions({
			orgId: args.orgId,
			userId: args.userId,
			questions,
			mergeById: args.mergeById,
		});

		console.log(`Uploaded ${uploadedCount} questions to organizations/${args.orgId}/questQuestions`);
		process.exit(0);
	} catch (err) {
		console.error('Upload failed:', err.message);
		process.exit(1);
	}
}

main();
