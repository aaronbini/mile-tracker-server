'use strict';

const express = require('express');
const app = express();
const trips = require('./routes/trips');
const flights = require('./routes/flights');
const groundTrips = require('./routes/groundTrips');
const movements = require('./routes/movements');
const users = require('./routes/users');
const auth = require('./routes/auth');
const errorhandler = require('./errorHandler');
const notFound = require('./notFound');
const path = require('path');
const publicPath = path.resolve( __dirname, '../public' );
const ensureAuth = require('./auth/ensureAuth');

const cors = require('./auth/cors')('*');

module.exports = app
.use(express.static(publicPath))
.use(cors)
.use('/api/auth', auth)
.use('/api/flights', flights)
.use('/api/trips', ensureAuth, trips)
.use('/api/groundTrips', ensureAuth, groundTrips)
.use('/api/movements', ensureAuth, movements)
.use('/api/users', ensureAuth, users)
.use(errorhandler)
.use(notFound);