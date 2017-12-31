({
  type: 'recycle-list',
  attr: {
    append: 'tree',
    listData: [
      { type: 'A' },
      { type: 'B', poster: 'yy', title: 'y' },
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
        attr: { value: 'BANNER' }
      }]
    }, {
      type: 'text',
      attr: { value: '----' }
    }, {
      type: 'div',
      attr: {
        '@isComponentRoot': true,
        '@componentProps': {}
      },
      style: { height: '80px', justifyContent: 'center', backgroundColor: '#EEEEEE' },
      children: [{
        type: 'text',
        style: { color: '#AAAAAA', fontSize: '32px', textAlign: 'center' },
        attr: { value: 'All rights reserved.' }
      }]
    }]
  }, {
    type: 'cell-slot',
    attr: { append: 'tree', case: 'B' },
    children: [{
      type: 'div',
      attr: {
        '@isComponentRoot': true,
        '@componentProps': {}
      },
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
        attr: { value: 'BANNER' }
      }]
    }, {
      type: 'div',
      attr: {
        '@isComponentRoot': true,
        '@componentProps': {
          imageUrl: { '@binding': 'item.poster' },
          title: { '@binding': 'item.title' }
        }
      },
      children: [{
        type: 'image',
        style: { width: '750px', height: '1000px' },
        attr: {
          src: { '@binding': 'imageUrl' }
        }
      }, {
        type: 'text',
        style: { fontSize: '80px', textAlign: 'center', color: '#E95659' },
        attr: {
          value: { '@binding': 'title' }
        }
      }]
    }]
  }]
})
