/* global instantsearch */
app({
  appId: 'W69XAGVDFM',
  apiKey: 'adee40d0e5a869dad0e1654d94324ee0',
  indexName: 'documents',
  searchParameters: {
    hitsPerPage: 6
  },
  searchFunction: function (helper) {
    if (helper.state.query === '') {
        document.querySelector('#hits').innerHTML = ''
        return
    }
    helper.search()
  }
})


function app (opts) {
  const search = instantsearch({
    appId: opts.appId,
    apiKey: opts.apiKey,
    indexName: opts.indexName,
    urlSync: true,
    searchFunction: opts.searchFunction,
    searchParameters: opts.searchParameters
  })

  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#search-input',
      placeholder: 'Tüm dökümanların içinde arama yap...',
      autofocus: true,
      poweredBy: true
    })
  )

  search.addWidget(
    instantsearch.widgets.infiniteHits({
      container: '#hits',
      templates: {
        item: getTemplate('hit'),
        empty: getTemplate('no-results')
      },
      showMoreLabel: 'Daha fazla sonuç getir...',
      hitsPerPage: 3
    })
  )
  search.start()
}

function getTemplate (templateName) {
  return document.querySelector(`#${templateName}-template`).innerHTML
}

function getHeader(title) {
  return `<h5>${title}</h5>`;
}
