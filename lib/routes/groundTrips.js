'use strict';

const express = require('express');
const router = express.Router();
const request = require('request-promise-native');

const googleUri = 'https://maps.googleapis.com/maps/api/distancematrix/json?key=';

module.exports = router
.get('/', (req,res,next) => {
 
  const uri = `${googleUri}${process.env.MAPS_KEY}&origins=${req.query.from}&destinations=${req.query.to}&units=imperial`;
  request({uri, json: true})
    .then(response => res.send(response))
    .catch(next);
});