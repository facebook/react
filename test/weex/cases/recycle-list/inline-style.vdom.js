({
  type: 'recycle-list',
  attr: {
    append: 'tree',
    listData: [
      { type: 'A', color: '#606060' },
      { type: 'A', color: '#E5E5E5' }
    ],
    switch: 'type',
    alias: 'item'
  },
  children: [{
    type: 'cell-slot',
    attr: { append: 'tree', case: 'A' },
    style: {
      backgroundColor: '#FF6600'
    },
    children: [{
      type: 'text',
      style: {
        fontSize: '100px',
        color: { '@binding': 'item.color' }
      },
      attr: {
        value: 'content'
      }
    }]
  }]
})
