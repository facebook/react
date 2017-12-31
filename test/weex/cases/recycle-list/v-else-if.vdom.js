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
        '[[match]]': 'item.sourceA',
        src: { '@binding': 'item.sourceA' }
      }
    }, {
      type: 'image',
      attr: {
        '[[match]]': '!(item.sourceA) && (item.sourceB)',
        src: { '@binding': 'item.sourceB' }
      }
    }, {
      type: 'image',
      attr: {
        '[[match]]': '!(!(item.sourceA) && (item.sourceB))',
        src: { '@binding': 'item.placeholder' }
      }
    }]
  }]
})
