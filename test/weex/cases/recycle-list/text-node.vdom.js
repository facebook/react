({
  type: 'recycle-list',
  attr: {
    append: 'tree',
    listData: [
      { type: 'A', dynamic: 'decimal', two: '2', four: '4' },
      { type: 'A', dynamic: 'binary', two: '10', four: '100' }
    ],
    switch: 'type',
    alias: 'item'
  },
  children: [{
    type: 'cell-slot',
    attr: { append: 'tree', case: 'A' },
    children: [{
      type: 'text',
      attr: {
        value: 'static'
      }
    }, {
      type: 'text',
      attr: {
        value: { '@binding': 'item.dynamic' }
      }
    }, {
      type: 'text',
      attr: {
        value: [
          'one ',
          { '@binding': 'item.two' },
          ' three ',
          { '@binding': 'item.four' },
          ' five'
        ]
      }
    }]
  }]
})
