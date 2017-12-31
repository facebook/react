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
      type: 'text',
      event: ['click', 'longpress'],
      attr: { value: 'A' }
    }, {
      type: 'text',
      event: ['touchend'],
      attr: { value: 'B' }
    }]
  }]
})
