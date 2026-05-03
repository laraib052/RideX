const admin = require('firebase-admin');
const { firebase } = require('./env');

// Only initialize once (important — avoid duplicate app error)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebase.projectId,
      clientEmail: firebase.clientEmail,
      privateKey: firebase.privateKey,
    }),
  });
}

module.exports = admin;
