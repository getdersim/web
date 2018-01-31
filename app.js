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
const hooks = require('./hooks/index')
const app = express()
const moment = require('moment')
require('moment-timezone')
require('moment/locale/tr')

moment.globalLocale = 'tr'
app.locals.moment = moment

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(bodyParser.json())
app.use(session({
  secret: '2017CCDersIm',
  saveUninitialized: true,
  store: new FileStore({path: '/tmp/sessions', secret: '2017CCDersIm'}),
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
    return decodedToken
  } catch (e) {
    console.log(e)
    throw new Error(e)
  }
}

app.post('/api/login', async (req, res) => {
  if (!req.body) return res.sendStatus(400)

  try {
    let decodedToken = await verify(req.body.token)
    req.session.decodedToken = decodedToken
    res.json({ status: true, decodedToken })
  } catch (e) {
    res.json({ status: false, error: e })
  }
})

app.post('/api/logout', (req, res) => {
  req.session.decodedToken = null
  res.json({ status: true })
})

app.use((req, res, next) => {
  req.firebaseServer = firebase
  next()
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
