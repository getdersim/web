const algoliasearch = require('algoliasearch');
const client = algoliasearch('API_TOKEN', 'API_SECRET')
const ALGOLIA_INDEX_NAME = 'documents'
const index = client.initIndex(ALGOLIA_INDEX_NAME)

const moment = require('moment')
moment.locale('tr')

index.searchCacheEnabled = true
index.searchCacheExpiringTimeInterval = 300

module.exports.search = q => {
  return new Promise((resolve, reject) => {
    index.search({
      query: q,
      hitsPerPage: 3
    }, (err, content) => {
      if (err) {
        reject(err)
      }
      let response = content.hits.map(content => {
        return {
          title: content.title,
          displayName: content.displayName,
          thumbnail: content.thumbnail.url,
          date: moment(parseInt(content.date)).fromNow(),
          url: `https://ders.im/dokuman/${content.slug}`
        }
      })
      resolve(response)
    });
  });
}
