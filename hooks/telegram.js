const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const bot = new Telegraf('TELEGRAM_TOKEN')
const { search } = require('./algolia')
const categoryInitializer = require('./category')

let books = ['📓','📔','📒','📕','📗','📘','📙','📚','📖','📝']

bot.start((ctx) => ctx.reply('Selam, "/ara veri yapıları" sorgusu ile arama yapabilirsin..'))

bot.on('message', async ctx => {
  console.log(ctx.from.id, ctx.message)

  if (ctx.message.text.startsWith('/ara') || ctx.message.text.startsWith('/ara@DersimBot')) {
    if (ctx.chat.type == 'supergroup') {
      ctx.telegram.sendMessage(ctx.chat.id, `Bana bunları özelden sor canım... 😌`)
    } else if (ctx.chat.type == 'private') {
      let query = ctx.message.text.split('/ara')[1]
      let results = await search(query)
      results.map(doc => {
        let book = books[Math.floor(Math.random()*books.length)]
        let keyboard = Markup.inlineKeyboard([
          Markup.urlButton(`${book} ${doc.title} ⌚️ ${doc.date}`, doc.url ),
          Markup.callbackButton('Kapat', 'delete')
        ])
        ctx.replyWithPhoto(doc.thumbnail, Extra.markup(keyboard))
      })
    }
  }
})

module.exports.send = doc => {
  let book = books[Math.floor(Math.random()*books.length)]

  let keyboard = Markup.inlineKeyboard([
    Markup.urlButton(`${book} ${doc.title} ⌚️ ${doc.date}`, `https://ders.im/dokuman/${doc.slug}` ),
    Markup.callbackButton('Kapat', 'delete')
  ])

  bot.telegram.sendPhoto('-1001193267765', doc.thumbnail.url, Extra.markup(keyboard))
}

bot.command('verify', (ctx) => {
  if (ctx.from.id !== '149632499') {
    ctx.reply('Bunu sadece admin yapabilir.')
    return
  }
  let slug = ctx.message.text.split('/verify')[1]
  categoryInitializer(slug)
  ctx.reply('İşlem başladı..')
})

bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.startPolling()
