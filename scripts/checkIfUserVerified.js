const admin = require('firebase-admin');
const serviceAccount = require('./adminkey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin.auth().getUser('ncd7dhljN2My53DTPbp41gOgTQ62').then((user) => {
  console.log('Email verified:', user.emailVerified);
});