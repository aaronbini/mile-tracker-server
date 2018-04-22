'use strict';
const app = require('./lib/app');
require('./lib/mongoose-setup');
const http = require('http');
const port = process.env.PORT || 8082;

const server = http.createServer(app);
server.listen(port, () => {
  console.log('server running at', server.address());
});

/**
 * App features to implement:
 * ability to delete one's own trip
 * ability for admins to delete trips
 * 
 */
