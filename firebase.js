const admin = require('firebase-admin')

const firebase = admin.initializeApp({
  credential: admin.credential.cert(require('./credentials/serviceAccount.json')),
  databaseURL: 'https://getdersim.firebaseio.com',
  storageBucket: 'getdersim.appspot.com'
}, 'server')

module.exports = firebase
