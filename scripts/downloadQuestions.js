const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const serviceAccount = require('./adminkey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function parseArgs(argv) {
  const args = {
    orgId: null,
    outFile: 'questions.export.json',
    includeIds: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--orgId') args.orgId = argv[i + 1];
    if (token === '--out') args.outFile = argv[i + 1];
    if (token === '--includeIds') args.includeIds = true;
  }

  return args;
}

function assertRequiredArgs(args) {
  if (!args.orgId) {
    throw new Error(
      'Usage: node downloadQuestions.js --orgId <orgId> [--out <file.json>] [--includeIds]'
    );
  }
}

function normalizeTimestamp(value) {
  if (!value) return value;
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return value;
}

function mapDocToQuestion(doc, includeIds) {
  const data = doc.data();
  const question = {
    ...data,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };

  if (includeIds) {
    question.id = doc.id;
  }

  return question;
}

async function downloadQuestions({ orgId, outFile, includeIds }) {
  const snapshot = await db
    .collection('organizations')
    .doc(orgId)
    .collection('questQuestions')
    .orderBy('createdAt', 'asc')
    .get();

  const questions = snapshot.docs.map((doc) => mapDocToQuestion(doc, includeIds));
  const outputPath = path.resolve(process.cwd(), outFile);

  fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');

  return {
    outputPath,
    count: questions.length,
  };
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    assertRequiredArgs(args);

    const result = await downloadQuestions({
      orgId: args.orgId,
      outFile: args.outFile,
      includeIds: args.includeIds,
    });

    console.log(
      `Downloaded ${result.count} questions from organizations/${args.orgId}/questQuestions to ${result.outputPath}`
    );
    process.exit(0);
  } catch (err) {
    console.error('Download failed:', err.message);
    process.exit(1);
  }
}

main();
