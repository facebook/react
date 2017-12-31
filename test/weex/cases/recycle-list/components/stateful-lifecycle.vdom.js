({
  type: 'recycle-list',
  attr: {
    append: 'tree',
    listData: [
      { type: 'X' },
      { type: 'X' }
    ],
    switch: 'type',
    alias: 'item'
  },
  children: [{
    type: 'cell-slot',
    attr: { append: 'tree', case: 'X' },
    children: [{
      type: 'div',
      attr: {
        '@isComponentRoot': true,
        '@componentProps': {}
      },
      children: [{
        type: 'text',
        attr: {
          value: { '@binding': 'number' }
        }
      }]
    }]
  }]
})
