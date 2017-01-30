'use strict';

const express = require('express');
const router = express.Router();
const request = require('request-promise-native');

const googleUri = 'https://maps.googleapis.com/maps/api/distancematrix/json?key=';

module.exports = router
.get('/', (req,res,next) => {
  
  let uri = `${googleUri}${process.env.MAPS_KEY}&origins=${req.query.from}&destinations=${req.query.to}&units=imperial`;

  //if transit mode is bus or train, specify that here before request
  if (req.query.mode === 'bus' || req.query.mode === 'train') {
    uri = `${uri}&mode=transit&transit_mode=${req.query.mode}`;
  }
 
  request({uri, json: true})
    .then(response => res.send(response))
    .catch(next);
});