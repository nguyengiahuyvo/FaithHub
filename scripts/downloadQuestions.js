const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const serviceAccount = require('./adminkey.json');
const DEFAULT_OUT_FILE = 'questions.export.json';

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

function parseArgs(argv) {
	const args = {
		outFile: DEFAULT_OUT_FILE,
		includeIds: false,
		includeAnsweredUsers: false,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		if (token === '--out') args.outFile = argv[i + 1];
		if (token === '--includeIds') args.includeIds = true;
		if (token === '--includeAnsweredUsers') args.includeAnsweredUsers = true;
	}

	return args;
}

function mapDocToQuestion(doc, { includeIds, includeAnsweredUsers }) {
	const data = doc.data() || {};
	const out = {
		answer: data.answer,
		translations: data.translations || {},
	};
	if (includeIds) out.id = doc.id;
	if (typeof data.ref === 'string' && data.ref.trim()) out.ref = data.ref;
	if (includeAnsweredUsers && data.answeredUsers) {
		out.answeredUsers = data.answeredUsers;
	}
	return out;
}

async function downloadQuestions({ outFile, includeIds, includeAnsweredUsers }) {
	const snapshot = await db.collection('questions').get();
	const questions = snapshot.docs.map((doc) =>
		mapDocToQuestion(doc, { includeIds, includeAnsweredUsers })
	);
	const outputPath = path.resolve(process.cwd(), outFile);
	fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');
	return { outputPath, count: questions.length };
}

async function main() {
	try {
		const args = parseArgs(process.argv.slice(2));
		const result = await downloadQuestions(args);
		console.log(`Downloaded ${result.count} questions from /questions to ${result.outputPath}`);
		process.exit(0);
	} catch (err) {
		console.error('Download failed:', err.message);
		process.exit(1);
	}
}

main();
