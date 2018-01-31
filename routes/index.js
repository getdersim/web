const express = require('express')
const router = express.Router()
const firebase = require('../firebase')
const db = firebase.firestore()

router.get('/', (req, res) => {
  const user = req.session.decodedToken
  db.collection('document')
  .orderBy('date', 'desc')
  // .limit(6)
  .get()
  .then(docs => {
    docs = docs.docs.map(doc => doc.data())
    res.render('index', { title: `Ders.im | Ana Sayfa`, user, docs, home: true })
  })
  .catch(() => {
    res.render('index', { title: `Ders.im | Ana Sayfa`, user, docs: [], home: true })
  })
})

/* GET detail page. */
router.get('/dokuman/:slug?', async (req, res) => {
  if (!req.params.slug) {
    res.redirect(301, '/')
  }
  const user = req.session.decodedToken
  const slug = req.params.slug
  try {
    let snapshot = await db.doc(`document/${slug}`).get()
    let data = snapshot.data()

    let isOwner = false
    // console.log(data)
    if ((user && data.uid === user.uid) || data.isAdmin) {
      isOwner = true
    }
    let pdf = null
    // If user loggedIn render pdf.
    try {
      if (data.hasPreview && !data.doc) {
        let pdfSnapshot = await db.doc(`pdf/${slug}`).get()
        pdf = pdfSnapshot.data()
      } else {
        pdf = data.doc
      }
    } catch (e) {
      pdf = data.doc
    }
    console.log(pdf.url);

    res.render('doc', { title: `Ders.im | ${data.title}`, user, doc: data, pdf, isOwner })
  } catch (e) {
    console.log(e)
    res.status(404).send('Döküman mevcut değil veya yüklenirken hata oluştu.')
  }
})

router.get('/@:slug?', async (req, res) => {
  if (!req.params.slug) {
    res.redirect(301, '/')
  }

  const loggedInUser = req.session.decodedToken

  try {
    let user = await db.collection('user').where('slug', '==', req.params.slug).get()
    user = user.docs[0].data()
    console.log(user)
    let isOwner = false
    if (loggedInUser && loggedInUser.uid === user.uid) {
      isOwner = true
    }

    let documents = await db.collection('document')
    .where('userSlug', '==', user.slug)
    .orderBy('date', 'desc')
    .get()
    documents = documents.docs.map(doc => doc.data())

    res.render('profile', {
      title: `Ders.im | ${user.displayName}`,
      user: loggedInUser,
      profile: user,
      docs: documents,
      isOwner
    })
  } catch (e) {
    console.log(e)
    res.redirect(404, '/')
  }
})

module.exports = router
