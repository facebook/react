({
  type: 'recycle-list',
  attr: {
    append: 'tree',
    listData: [
      { type: 'A', count: 1, source: 'http://whatever.com/x.png' },
      { type: 'A', count: 2, source: 'http://whatever.com/y.png' },
      { type: 'A', count: 3, source: 'http://whatever.com/z.png' }
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
        resize: 'cover',
        src: {
          '@binding': 'item.source'
        }
      }
    }, {
      type: 'text',
      attr: {
        lines: '3',
        count: {
          '@binding': 'item.count'
        }
      }
    }]
  }]
})
