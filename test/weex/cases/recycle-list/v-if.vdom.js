({
  type: 'recycle-list',
  attr: {
    append: 'tree',
    listData: [
      { type: 'A' },
      { type: 'A' }
    ],
    switch: 'type',
    alias: 'item'
  },
  children: [{
    type: 'cell-slot',
    attr: { append: 'tree', case: 'A' },
    children: [{
      type: 'image',
      attr: {
        '[[match]]': 'item.source',
        src: { '@binding': 'item.source' }
      }
    }, {
      type: 'text',
      attr: {
        '[[match]]': '!item.source',
        value: 'Title'
      }
    }]
  }]
})
