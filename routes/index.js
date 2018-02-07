const express = require('express')
const router = express.Router()
const firebase = require('../firebase')
const db = firebase.firestore()

router.get('/', async (req, res) => {
  const user = req.session.decodedToken
  try {
    let docs = await db.collection('document').orderBy('date', 'desc').limit(12).get()
    docs = docs.docs.map(doc => doc.data())

    let syllabus = await db.collection('syllabus').orderBy('date', 'desc').limit(12).get()
    syllabus = syllabus.docs.map(syl => syl.data())
    res.render('index', { title: `Ders.im | Ana Sayfa`, user, docs, syllabus, home: true })
  } catch (e) {
    res.render('index', { title: `Ders.im | Ana Sayfa`, user, docs: [], syllabus: [], home: true })
  }
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

    let isOwner
    try {
      if ((user && data.uid === user.uid) || (user && user.isAdmin)) {
        isOwner = true
      }
    } catch (e) {
      isOwner = false
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

    res.render('doc', { title: `Ders.im | ${data.title}`, user, doc: data, pdf, isOwner })
  } catch (e) {
    console.log(e)
    res.status(404).send('Döküman mevcut değil veya yüklenirken hata oluştu.')
  }
})

/* GET syllabus page. */
router.get('/ozet', async (req, res) => {
  const user = req.session.decodedToken
  res.render('syllabus', { title: `Ders.im | Özet`, user })
})

/* GET syllabus page. */
router.get('/ozet/duzenle/:slug', async (req, res) => {
  const user = req.session.decodedToken
  let snapshot = await db.doc(`syllabus/${req.params.slug}`).get()
  let data = snapshot.data()
  let isOwner = false
  // console.log(data)
  if ((user && data.uid === user.uid) || user.isAdmin) {
    isOwner = true
  }
  res.render('syllabus', { title: `Ders.im | Özet`, user, syl: data, isOwner })
})

router.get('/~:slug', async (req, res) => {
  if (!req.params.slug) {
    res.redirect(301, '/')
  }
  const user = req.session.decodedToken
  const slug = req.params.slug
  try {
    let snapshot = await db.doc(`syllabus/${slug}`).get()
    let data = snapshot.data()

    let isOwner = false
    if ((user && data.uid === user.uid) || (user && user.isAdmin)) {
      isOwner = true
    }

    res.render('syllabusDetail', { title: `Ders.im | ${data.title}`, user, syllabus: data, isOwner })
  } catch (e) {
    console.log(e)
    res.status(404).send('Özet mevcut değil veya yüklenirken hata oluştu.')
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
    res.redirect(302, '/')
  }
})

module.exports = router
