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
        '@isComponentRoot': true,
        '@componentProps': {
          message: 'No binding'
        }
      },
      children: [{
        type: 'text',
        style: {
          height: '80px',
          fontSize: '60px',
          color: '#41B883'
        },
        attr: {
          value: { '@binding': 'output' }
        }
      }, {
        type: 'input',
        event: ['input'],
        style: {
          fontSize: '50px',
          color: '#666666',
          borderWidth: '2px',
          borderColor: '#41B883'
        },
        attr: {
          type: 'text',
          value: 'No binding'
        }
      }]
    }]
  }]
})
