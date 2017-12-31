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
        '@componentProps': {}
      },
      // not supported yet
      // style: {
      //   height: '120px',
      //   justifyContent: 'center',
      //   alignItems: 'center',
      //   backgroundColor: 'rgb(162, 217, 192)'
      // },
      children: [{
        type: 'text',
        // style: {
        //   fontWeight: 'bold',
        //   color: '#41B883',
        //   fontSize: '60px'
        // },
        attr: {
          value: 'BANNER'
        }
      }]
    }, {
      type: 'text',
      attr: {
        value: 'content'
      }
    }]
  }]
})
