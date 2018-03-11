const express = require('express')
const router = express.Router()
const firebase = require('../firebase')
const db = firebase.firestore()
const slugify = require('slugify')

const slugger = text => slugify(text, {
  replacement: "-",
  lower: true
})

router.get('/', async (req, res) => {
  const user = req.session.decodedToken
  const limit = req.session.downloadLimit || 1
  const first = req.session.first

  try {
    let docs = await db.collection('document').orderBy('date', 'desc').limit(12).get()
    docs = docs.docs.map(doc => doc.data())

    let categories = await db.collection('category').orderBy('count', 'desc').limit(8).get().then(d => d.docs.map(c => c.data()))

    let syllabus = await db.collection('syllabus').orderBy('date', 'desc').limit(12).get()
    syllabus = syllabus.docs.map(syl => syl.data())
    res.render('index', { title: `Ders.im | Ana Sayfa`, user, docs, syllabus, categories, home: true, limit, first})
  } catch (e) {
    res.render('index', { title: `Ders.im | Ana Sayfa`, user, docs: [], syllabus: [], home: true })
  }
})

router.get('/kategori/:slug', async (req, res) => {
  const user = req.session.decodedToken
  const slug = slugger(req.params.slug)

  let coolCategories = await db.doc(`category/${slug}`)
    .get()
    .then(async (category) => {
      let related = await category.ref.collection('related')
      .orderBy('count', 'desc')
      .limit(5)
      .get()
      .then(o => o.docs.map(p => p.data()))

      let documents = await category.ref.collection('document')
        .orderBy('viewCount', 'desc')
        .limit(12)
        .get()
        .then(o => o.docs.map(p => p.data()))

      return {related, data:category.data(), documents}
    })
    .then(obj => {
      res.render('category', { title: `Ders.im | ${obj.data.title}`, user, docs:obj.documents, related: obj.related, data: obj.data, home: false})
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send('Hata oluştu.')
    })
})

router.get('/api/view/:category/:doc', async (req, res) => {
  const user = req.session.decodedToken
  const categorySlug = req.params.category
  const documentSlug = req.params.doc

  db.doc(`category/${categorySlug}/document/${documentSlug}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        doc.ref.update({
          viewCount: ++doc.data().viewCount
        })
        .then(_ => res.json({status: true}))
        .catch(_ => res.status(400).json({status: false}))
      }
  })
  .catch(_ => res.status(400).json({status: false}))
})

router.get('/dokuman/:slug?', async (req, res) => {
  if (!req.params.slug) {
    res.redirect(301, '/')
  }
  const user = req.session.decodedToken
  const slug = req.params.slug
  const limit = req.session.downloadLimit || 1
  const first = req.session.first

  try {
    let snapshot = await db.doc(`document/${slug}`).get()
    let data = snapshot.data()

    let isOwner
    let isAdmin = false
    try {
      if ((user && data.uid === user.uid) || (user && user.isAdmin)) {
        isOwner = true
      }
      isAdmin = user.isAdmin || false
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

    try {
      if (data.source.trim().length > 0) {
        data.source = data.source.includes('http') ? data.source : 'http://' + data.source
      }
    } catch (e) {
      delete data.source
    }

    let keywords = [`${data.title} ders notları`, 'ders dökümanları', 'ders materyalleri', 'çalışma notları', 'ders notu', `${data.displayName}'nın ders notları`].join(',')
    if (data.keywords && data.keywords.length > 0) {
      data.keywords = data.keywords.map(d => {
        return {
          tag: d.tag,
          slug: slugger(d.tag)
        }
      })
    }

    res.render('doc', { title: `Ders.im | ${data.title}`, user, doc: data, pdf, isOwner, keywords, limit, isAdmin })
  } catch (e) {
    console.log(e)
    res.status(404).send('Döküman mevcut değil veya yüklenirken hata oluştu.')
  }
})

router.get('/ozet', async (req, res) => {
  const user = req.session.decodedToken
  res.render('syllabus', { title: `Ders.im | Özet`, user })
})

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
    .limit(12)
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
