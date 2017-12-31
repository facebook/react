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
      type: 'div',
      attr: {
        '[[repeat]]': {
          '@expression': 'item.list',
          '@alias': 'panel'
        }
      },
      children: [{
        type: 'text',
        attr: {
          value: {
            '@binding': 'panel.label'
          }
        }
      }]
    }]
  }]
})
