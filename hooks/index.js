// This file contains firestore hooks.
const firebase = require('../firebase')

const puppeteer = require('puppeteer')
const fs = require('fs')

const generateGIF = url => {
  return new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    })
    const page = await browser.newPage()
    await page.goto(`https://gifi.cagatay.me/?pdf=${url}`)

    page.on('console', async msg => {
      var data = msg._text.replace(/^data:image\/\w+;base64,/, '')
      var buffer = Buffer.from(data, 'base64')
      let d = new Date()
      let filename = `${d.valueOf()}.gif`
      fs.writeFile(filename, buffer)
      await browser.close()
      resolve(filename)
    })
  })
}
//
// generateGIF('https://firebasestorage.googleapis.com/v0/b/dersim-app.appspot.com/o/dokuman%2F1ytpa6J5KjXNES6JFFjtaKWvoLF2%2F1516460218962.pdf?alt=media&token=f7184e1c-2089-49d4-966b-00ede78c98b3')
//   .then(filename => console.log(filename))
