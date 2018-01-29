// This file contains firestore hooks.
const puppeteer = require('puppeteer')
const firebase = require('../firebase')
const fs = require('fs')
const db = firebase.firestore()
const bucket = firebase.storage().bucket('getdersim-media')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)

// Generate gif from given pdf url
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
      writeFile(filename, buffer)
      await browser.close()
      resolve(filename)
    })
  })
}

// Generate thumbnail from given pdf url
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
      writeFile(filename, buffer)
      await browser.close()
      resolve(filename)
    })
  })
}

const process = (docs, i = 0) => {
    return new Promise(async (resolve, reject) => {
      try {
        let doc = docs[i]
        let url = doc.doc.url
        let thumbnailFile = await generateThumbnail(url)
        let gifFile = await generateGIF(url)
        let uploadedThumbnail = await bucket.upload(thumbnailFile)
        let [thumbnailURL] = await bucket.file(thumbnailFile).getSignedUrl({
            action: 'read',
            expires: '03-17-2100',
          })
        console.log(doc.title, 'thumbnail üretildi');
        let uploadedGIF = await bucket.upload(gifFile)
        let [gifURL] = await bucket.file(gifFile).getSignedUrl({
            action: 'read',
            expires: '03-17-2100',
          })
        // remove temp files.
        fs.unlinkSync(thumbnailFile)
        fs.unlinkSync(gifFile)
        let result = await db.doc(`document/${doc.slug}`).update({
          thumbnail: {url: thumbnailURL, id: thumbnailFile},
          gif: {url: gifURL, id: gifFile},
          hasPreview: true
        })
        i++
        if (docs.length > i) {
          await process(docs, i)
        } else {
          resolve(true)
        }
      } catch (e) {
        reject(e)
      }
    });
}

const removeContent = id => {
  bucket.file(id).delete().then(() => console.log('Uploaded content deleted.')).catch(err => console.log(err))
}

db.collection('document')
  .onSnapshot(async snapshot => {
    let toBeUpdated = []
    toBeUpdated = snapshot.docChanges.map(change => {
      let data = change.doc.data()
      if ((change.type === 'added' || change.type === 'modified') && (!data.gif && !data.thumbnail)) {
        return data
      } else if (change.type === 'removed') {
        try {
          console.log('Removed one..');
          removeContent(data.gif.id)
          removeContent(data.thumbnail.id)
        } catch (e) {
          console.log(e);
        }
      }
    })
    toBeUpdated = toBeUpdated.filter(n => n)
    if (toBeUpdated.length > 0) {
      try {
        await process(toBeUpdated)
        console.log('MEDIA GENERATE SUCCESS.');
      } catch (e) {
        console.log(e);
      }
    }
  })
