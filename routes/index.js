const express = require('express')
const router = express.Router()
const firebase = require('../firebase')
const db = firebase.firestore()

router.get('/', (req, res) => {
  const user = req.session.decodedToken
  db.collection('document')
  .orderBy('date', 'desc')
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
router.get('/dokuman/:slug?', (req, res) => {
  if (!req.params.slug) {
    res.redirect(301, '/')
  }
  const user = req.session.decodedToken
  const slug = req.params.slug
  db.doc(`document/${slug}`)
    .get()
    .then(result => {
      const data = result.data()
      let isOwner = false
      if ((user && data.uid === user.uid) || data.isAdmin) {
        isOwner = true
      }
      res.render('doc', { title: `Ders.im | ${data.title}`, user, doc: data, isOwner })
    })
    .catch(err => {
      console.log(err) // render 404
      res.status(404).end('Döküman mevcut değil.')
    })
})

router.get('/@:slug?', (req, res) => {
  if (!req.params.slug) {
    res.redirect(301, '/')
  }

  const user = req.session.decodedToken

  db.doc(`user/${req.params.slug}`)
    .get()
    .then(result => result.data())
    .then(data => {
      console.log(user, data);
      let isOwner = false
      if ((user && data.uid === user.uid) || data.isAdmin) {
        isOwner = true
      }
      res.render('profile', { title: `Ders.im | ${data.displayName}`, user, data })
    })
    .catch(err => {
      console.log('Kullanıcı mevcut değil', req.params.slug)
      res.redirect(301, '/')
    })

  // console.log(req.params.slug)
})

module.exports = router
