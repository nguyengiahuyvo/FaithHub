const admin = require('firebase-admin');
const serviceAccount = require('./adminkey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

function parseArgs(argv) {
	const args = {
		orgId: null,
		title: null,
		body: null,
		data: null,
		url: null,
		dryRun: false,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		if (token === '--orgId') args.orgId = argv[i + 1];
		if (token === '--title') args.title = argv[i + 1];
		if (token === '--body') args.body = argv[i + 1];
		if (token === '--url') args.url = argv[i + 1];
		if (token === '--data') {
			try {
				args.data = JSON.parse(argv[i + 1]);
			} catch {
				throw new Error('--data must be a valid JSON string, e.g. \'{"screen":"quiz"}\'');
			}
		}
		if (token === '--dry-run') args.dryRun = true;
	}

	return args;
}

function assertRequiredArgs(args) {
	if (!args.orgId || !args.title || !args.body) {
		throw new Error(
			'Usage: node sendNotification.js --orgId <orgId> --title <title> --body <body> [--url <https://...>] [--data \'{"key":"value"}\'] [--dry-run]'
		);
	}
}

function buildPayloadData(args) {
	const payload = args.data ? { ...args.data } : {};

	if (args.url) {
		payload.url = args.url;
	}

	if (Object.keys(payload).length === 0) {
		return undefined;
	}

	return payload;
}

async function collectMemberUids(orgId) {
	const membersRef = db.collection('organizations').doc(orgId).collection('members');
	const snapshot = await membersRef.get();

	if (snapshot.empty) {
		throw new Error(`No members found in organizations/${orgId}/members`);
	}

	return snapshot.docs.map((doc) => doc.id);
}

async function collectExpoTokens(uids) {
	if (uids.length === 0) return [];

	const refs = uids.map((uid) => db.collection('users').doc(uid));
	const docs = await db.getAll(...refs);

	const tokens = [];
	const missing = [];

	docs.forEach((doc) => {
		if (!doc.exists) {
			missing.push({ uid: doc.id, reason: 'user doc not found' });
			return;
		}
		const data = doc.data();
		const token = data.expoPushToken;
		if (typeof token === 'string' && token.trim()) {
			tokens.push({ uid: doc.id, token: token.trim() });
		} else {
			missing.push({ uid: doc.id, reason: 'no expoPushToken field' });
		}
	});

	return { tokens, missing };
}

function isValidExpoToken(token) {
	return /^Expo(nent)?PushToken\[.+\]$/.test(token);
}

async function sendExpoBatch(messages) {
	const res = await fetch(EXPO_PUSH_URL, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Accept-Encoding': 'gzip, deflate',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(messages),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Expo push API ${res.status}: ${text}`);
	}

	const json = await res.json();
	return json.data || [];
}

async function sendInBatches(tokens, title, body, data) {
	let successCount = 0;
	let failureCount = 0;
	const failures = [];

	const payloadData = data
		? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
		: undefined;

	for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
		const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
		const messages = batch.map((t) => ({
			to: t.token,
			title,
			body,
			sound: 'default',
			...(payloadData ? { data: payloadData } : {}),
		}));

		const tickets = await sendExpoBatch(messages);

		tickets.forEach((ticket, idx) => {
			if (ticket.status === 'ok') {
				successCount += 1;
			} else {
				failureCount += 1;
				failures.push({
					uid: batch[idx].uid,
					token: batch[idx].token,
					error: ticket.message || 'Unknown error',
					details: ticket.details,
				});
			}
		});

		if (i + EXPO_BATCH_SIZE < tokens.length) {
			console.log(`  Sent batch ${Math.floor(i / EXPO_BATCH_SIZE) + 1}...`);
		}
	}

	return { successCount, failureCount, failures };
}

async function main() {
	try {
		const args = parseArgs(process.argv.slice(2));
		assertRequiredArgs(args);

		console.log(`Fetching members for organization: ${args.orgId}`);
		const uids = await collectMemberUids(args.orgId);
		console.log(`Found ${uids.length} member(s)`);

		console.log(`Looking up Expo push tokens in users/...`);
		const { tokens, missing } = await collectExpoTokens(uids);

		if (missing.length > 0) {
			console.log(`Skipped ${missing.length} member(s) without a token:`);
			missing.forEach((m) => console.log(`  [${m.uid}] ${m.reason}`));
		}

		const valid = tokens.filter((t) => isValidExpoToken(t.token));
		const invalid = tokens.filter((t) => !isValidExpoToken(t.token));

		if (invalid.length > 0) {
			console.log(`Skipped ${invalid.length} invalid token(s) (not ExponentPushToken[...]):`);
			invalid.forEach((t) => console.log(`  [${t.uid}] ${t.token}`));
		}

		if (valid.length === 0) {
			console.log('No valid Expo push tokens found. No notifications sent.');
			process.exit(0);
		}

		console.log(`Ready to send to ${valid.length} device(s)`);
		const payloadData = buildPayloadData(args);

		if (args.dryRun) {
			console.log('\n[DRY RUN] Would send:');
			console.log(`  Title: ${args.title}`);
			console.log(`  Body:  ${args.body}`);
			if (payloadData) console.log(`  Data:  ${JSON.stringify(payloadData)}`);
			console.log(`  To ${valid.length} device(s)`);
			process.exit(0);
		}

		console.log(`\nSending notification...`);
		console.log(`  Title: ${args.title}`);
		console.log(`  Body:  ${args.body}`);

		const { successCount, failureCount, failures } = await sendInBatches(
			valid,
			args.title,
			args.body,
			payloadData
		);

		console.log(`\nDone!`);
		console.log(`  Success: ${successCount}`);
		console.log(`  Failed:  ${failureCount}`);

		if (failures.length > 0) {
			console.log(`\nFailed:`);
			failures.forEach((f) => {
				const detail = f.details?.error ? ` (${f.details.error})` : '';
				console.log(`  [${f.uid}] ${f.error}${detail}`);
			});
		}

		process.exit(0);
	} catch (err) {
		console.error('Send failed:', err.message);
		process.exit(1);
	}
}

main();
