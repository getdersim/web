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
    await page.goto(`https://media.ders.im/?pdf=${url}`)

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
const generateThumbnail = url => {
  return new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    })
    const page = await browser.newPage()
    await page.goto(`https://media.ders.im/thumbnail.html?pdf=${url}`)

    page.on('console', async msg => {
      var data = msg._text.replace(/^data:image\/\w+;base64,/, '')
      var buffer = Buffer.from(data, 'base64')
      let d = new Date()
      let filename = `${d.valueOf()}.png`
      fs.writeFile(filename, buffer)
      await browser.close()
      resolve(filename)
    })
  })
}

// generateThumbnail('https://firebasestorage.googleapis.com/v0/b/getdersim.appspot.com/o/document%2FAlx6G918rubxhj6yegR6WlFWiay1%2F1516504221992.pdf?alt=media&token=cafc38ba-e30c-4da7-8715-fc026d649b41').then(img => console.log(img))
//
// generateGIF('https://firebasestorage.googleapis.com/v0/b/getdersim.appspot.com/o/document%2FAlx6G918rubxhj6yegR6WlFWiay1%2F1516504221992.pdf?alt=media&token=cafc38ba-e30c-4da7-8715-fc026d649b41')
//   .then(filename => console.log(filename))
