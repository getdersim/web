const firebase = require('../firebase')
const db = firebase.firestore()
const slugify = require('slugify')

const slugger = text => slugify(text, {
  replacement: "-",
  lower: true
})

const findPairs = (arr, i) => {
  let temp = arr
  temp = temp.map(t => t.tag)
  delete temp[i]
  temp = temp.filter(t => t)
  return temp
}

const progress = (arr, doc, i = -1) => {
  return new Promise(async (resolve, reject) => {
    try {
      ++i
      if (i <= 2) {
        let slug = slugger(arr[i].tag)
        console.log('pairs', findPairs(arr, i), slug);
        let pairs = findPairs(arr, i)
        let category = await db.doc(`category/${slug}`)
          .get()
          .then(async (ca) => {
            // Eğer bu kategori hiç yoksa!
            if (!ca.exists) {
              // Diğer ilişkili kategorileri kaydet.
              pairs.forEach(p => {
                let s = slugger(p)
                // Kendine ilişkili olan diğer kategorileri ekle
                db.doc(`category/${slug}/related/${s}`).set({
                  title: p,
                  slug: s,
                  count: 1
                })

                // Diğer kategori var mı onu kontrol et.
                db.doc(`category/${s}`).get().then(otherCategory => {

                  arr.forEach(a => {
                    // Ben bu değilsem
                    if (a.tag !== p) {
                      let oSlug = slugger(a.tag)
                      let title = a.tag

                      if (otherCategory.exists) {
                        // Eğer bu kategori daha önce varsa ve bu kategori ile daha önce eklendiyse
                        db.doc(`category/${s}/related/${oSlug}`).get().then(n => {
                          if (n.exists) {
                            // Kategorilerin eşleşme sayısını arttır
                            // Bu sayede en çok eşleşen etiketler daha önlerde çıkacak.
                            db.doc(`category/${s}/related/${oSlug}`).update({
                              count: ++n.data().count
                            })
                            db.doc(`category/${s}`).update({
                              count: ++otherCategory.data().count,
                            })
                          } else {
                            // Bu kategoriler birbiriyle ilk defa eşleştiler.
                            db.doc(`category/${s}/related/${oSlug}`).set({
                              count: 1,
                              slug: oSlug,
                              title
                            })
                          }
                        })
                      }
                    }
                  })
                })

                db.doc(`category/${s}/document/${doc.slug}`).set({
                  ...doc,
                  viewCount: 0
                })
              })
              // Dökümanın kendisini kaydet.
              db.doc(`category/${slug}/document/${doc.slug}`).set({
                ...doc,
                viewCount: 0
              })
              // Kategorinin kendisini kaydet.
              db.doc(`category/${slug}`).set({
                title: arr[i].tag,
                slug,
                count: 1
              })
            } else {
              // Bu kategori daha önce oluşturulmuş.
              // Bu dökümanın ilişkisini kontrol et.
              let docIsExist = await db.doc(`category/${slug}/document/${doc.slug}`).get().then(doc => doc.exists)
              if (docIsExist) {
                // Bu doc zaten eklenmiş. count değişmemeli
                // Related olan diğer pair'leri kontrol edelim, eğer o pair varsa count'u artacak değilse eklenecek.
                pairs.forEach(p => {
                  let s = slugger(p)
                  db.doc(`category/${s}/related/${slug}`).get().then(re => {
                    // Eğer daha önce eklendiyse
                    if (re.exists) {
                      db.doc(`category/${s}/related/${slug}`).update({
                        count: ++re.data().count
                      })
                    } else {
                      db.doc(`category/${s}/related/${slug}`).set({
                        title: arr[i].tag,
                        slug: slug,
                        count: 1
                      })
                    }
                  })
                })
              } else {
                console.log('Bu kategori vardı ama yeni döküman eklendi');
                // Bu doc ilk defa eklendi
                let count = ++ca.data().count
                await db.doc(`category/${slug}`).update({count})
                await db.doc(`category/${slug}/document/${doc.slug}`).set({
                  ...doc,
                  viewCount: 0
                })
              }
            }
            return ca
          })
        progress(arr, doc, i)
      }
    } catch (e) {
      console.log(e)
      resolve(true)
    }
  });
}

module.exports = slug => {
  db.doc(`document/${slug}`)
    .get()
    .then(s => s.data())
    .then(async doc => {
      return await progress(doc.keywords, doc)
    })
}
