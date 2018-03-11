const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const index = require('./routes/index')
const firebase = require('./firebase')
// const hooks = require('./hooks/index')
const app = express()
const moment = require('moment')
require('moment-timezone')
require('moment/locale/tr')

moment.globalLocale = 'tr'
app.locals.moment = moment

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(bodyParser.json())
app.use(session({
  secret: '2018CCDersIm',
  saveUninitialized: true,
  store: new FileStore({path: '/tmp/sessions', secret: '2018CCDersIm'}),
  resave: false,
  rolling: true,
  httpOnly: true,
  cookie: { maxAge: 604800000 } // week
}))

app.use('/', index)

async function verify (token) {
  try {
    let decodedToken = await firebase.auth().verifyIdToken(token)
    let user = await firebase.firestore().doc(`/user/${decodedToken.user_id}`).get()
    user = user.data()
    decodedToken.isAdmin = user.isAdmin
    decodedToken.slug = user.slug
    return decodedToken
  } catch (e) {
    console.log(e)
    throw new Error(e)
  }
}

app.use((req, res, next) => {
  console.log('MIDDLEWARE', req.session.downloadLimit);
  req.firebaseServer = firebase
  if (req.session.first) {
    req.session.first != req.session.first
  } else {
    req.session.first = true
    // req.session.downloadLimit = 1
  }
  next()
})

app.post('/api/login', async (req, res) => {
  if (!req.body) return res.sendStatus(400)

  try {
    let decodedToken = await verify(req.body.token)
    req.session.decodedToken = decodedToken
    req.session.downloadLimit = 1
    res.json({ status: true, decodedToken, limit: req.session.downloadLimit })
  } catch (e) {
    res.json({ status: false, error: e })
  }
})

app.post('/api/logout', (req, res) => {
  req.session.decodedToken = null
  // req.session.downloadLimit = req.session.downloadLimit || 10
  console.log('LOGOUT', req.session.downloadLimit);
  res.json({ status: true, limit: req.session.downloadLimit, message: 'I know you bro, you don\'t like limits but this isn\'t for you. You can bypass this easily. But who cares? I do not.' })
})

app.get('/api/download', (req, res) => {
  if (req.session.decodedToken) {
    res.json({ status: true, limit: req.session.downloadLimit, message: 'You are logged in, that\'s the point. You got this friend. Here\'s your document.' })
  } else {
    req.session.downloadLimit = --req.session.downloadLimit || 0
    if (req.session.downloadLimit < 0) {
      req.session.downloadLimit = 0
    }
    res.json({ status: true, limit: req.session.downloadLimit, message: 'I know you bro, you don\'t like limits but this isn\'t for you. You can bypass this easily. But who cares? I do not.' })
  }
})

app.get('/api/gain', (req, res) => {
  req.session.downloadLimit += 1
  res.json({ status: true, limit: req.session.downloadLimit, message: 'I know you bro, you don\'t like limits but this isn\'t for you. You can bypass this easily. But who cares? I do not.' })
})

app.get('/api/limit', (req, res) => {
  req.session.downloadLimit = req.session.downloadLimit || 0
  res.json({ status: true, limit: req.session.downloadLimit })
})

app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use((err, req, res, next) => {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
