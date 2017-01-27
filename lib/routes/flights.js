'use strict';

const express = require('express');
const router = express.Router();
const request = require('request-promise-native');

module.exports = router
.get('/', (req,res,next) => {
  //get all airports, then send only code, name, city, country
  const uri = `https://airport.api.aero/airport?user_key=${process.env.AERO_API}`;
  request({uri, json: true})
    .then(response => {
      let filtered = response.airports.map(airport => {
        return {code: airport.code, name: airport.name, city: airport.city, country: airport.country};
      });
      res.send(filtered);
    })
    .catch(next);
})
.get('/distance', (req, res, next) => {
  console.log(req.query);
  const uri = `https://airport.api.aero/airport/distance/${req.query.start}/${req.query.end}?user_key=${process.env.AERO_API}&units=mile`;
  request({uri, json: true})
    .then(distance => res.send(distance))
    .catch(next);
});