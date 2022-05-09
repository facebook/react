export default [
  {
    route: '/todos',
    method: 'GET',
    handler(req, res) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify([
          {
            id: 1,
            text: 'Shave yaks',
          },
          {
            id: 2,
            text: 'Eat kale',
          },
        ])
      );
    },
  },
];
