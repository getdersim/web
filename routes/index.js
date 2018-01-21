const express = require('express')
const router = express.Router()
const firebase = require('../firebase')

/* GET home page. */
router.get('/', (req, res, next) => {
  const user = req.session.decodedToken
  res.render('index', { title: 'Ders.im | Ana sayfa', user, home: true })
})

/* GET home page. */
router.get('/dokuman/:slug', (req, res, next) => {
  const user = req.session.decodedToken
  const materyal = {
    department: 'Bilgisayar Mühendisliği',
    lesson: 'Veri Yapıları',
    subject: 'İkili Arama Ağaçları (BST)'
  }
  // Call firebase things in tha here.

  res.render('doc', {
    title: 'Ders.im | Döküman',
    home: false,
    user,
    materyal
  })
})

module.exports = router
