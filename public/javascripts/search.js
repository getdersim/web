/* global instantsearch */
app({
  appId: 'W69XAGVDFM',
  apiKey: 'adee40d0e5a869dad0e1654d94324ee0',
  indexName: 'documents',
  searchParameters: {
    hitsPerPage: 10
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
    searchFunction: opts.searchFunction
  })

  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#search-input',
      placeholder: 'Ders materyali ara',
      autofocus: true,
      poweredBy: true
    })
  )

  search.addWidget(
    instantsearch.widgets.hits({
      container: '#hits',
      templates: {
        item: getTemplate('hit'),
        empty: getTemplate('no-results')
      }
    })
  )
  //
  // search.addWidget(
  //   instantsearch.widgets.stats({
  //     container: '#stats',
  //   })
  // );
  //
  // search.addWidget(
  //   instantsearch.widgets.sortBySelector({
  //     container: '#sort-by',
  //     autoHideContainer: true,
  //     indices: [
  //       {
  //         name: opts.indexName,
  //         label: 'Most relevant',
  //       },
  //       {
  //         name: `${opts.indexName}_price_asc`,
  //         label: 'Lowest price',
  //       },
  //       {
  //         name: `${opts.indexName}_price_desc`,
  //         label: 'Highest price',
  //       },
  //     ],
  //   })
  // );

  // search.addWidget(
  //   instantsearch.widgets.pagination({
  //     container: '#pagination',
  //     scrollTo: '#search-input',
  //   })
  // );

  // search.addWidget(
  //   instantsearch.widgets.refinementList({
  //     container: '#category',
  //     attributeName: 'categories',
  //     operator: 'or',
  //     templates: {
  //       header: getHeader('Category'),
  //     },
  //   })
  // );

  // search.addWidget(
  //   instantsearch.widgets.refinementList({
  //     container: '#brand',
  //     attributeName: 'brand',
  //     operator: 'or',
  //     searchForFacetValues: {
  //       placeholder: 'Search for brands',
  //       templates: {
  //         noResults: '<div class="sffv_no-results">No matching brands.</div>',
  //       },
  //     },
  //     templates: {
  //       header: getHeader('Brand'),
  //     },
  //   })
  // );
  //
  // search.addWidget(
  //   instantsearch.widgets.rangeSlider({
  //     container: '#price',
  //     attributeName: 'price',
  //     templates: {
  //       header: getHeader('Price'),
  //     },
  //   })
  // );

  // search.addWidget(
  //   instantsearch.widgets.refinementList({
  //     container: '#type',
  //     attributeName: 'type',
  //     operator: 'and',
  //     templates: {
  //       header: getHeader('Type'),
  //     },
  //   })
  // );

  search.start()
}

function getTemplate (templateName) {
  return document.querySelector(`#${templateName}-template`).innerHTML
}
//
function getHeader(title) {
  return `<h5>${title}</h5>`;
}
