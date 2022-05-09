import express from 'express';
import apiRoutes from './api';
import handleRSC from './rsc.server.js';
import path from 'path';

const app = express();

app.use(express.static(path.resolve(process.cwd(), 'dist/client')));

apiRoutes.forEach(({route, handler, method}) =>
  app[method.toLowerCase()](route, handler)
);

app.get('/__react', handleRSC);

app.listen(3000, () => {
  console.log('Flight Server listening on port 3000...');
});

app.on('error', function(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});
