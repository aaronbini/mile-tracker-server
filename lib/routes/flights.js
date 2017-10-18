'use strict';

const express = require('express');
const router = express.Router();
const request = require('request-promise-native');
const Airport = require('../models/airport');
const distanceCalc = require('../distance-calc');

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
  const uri = `https://airport.api.aero/airport/distance/${req.query.start}/${req.query.end}?user_key=${process.env.AERO_API}&units=mile`;
  request({uri, json: true})
    .then(distance => res.send(distance))
    .catch(next);
})
.get('/distance/v2', (req, res, next) => {
  const start = Airport.find({ code: req.query.start }).lean();
  const end = Airport.find({code: req.query.end}).lean();

  Promise.all([start, end])
    .then(([starting, ending]) => {
      const departure = starting[0];
      const destination = ending[0];
      const departureCoordinates = [departure.lat, departure.lng];
      const destinationCoordinates = [destination.lat, destination.lng];
      const distance = (distanceCalc(departureCoordinates, destinationCoordinates, true) * 100 ) / 100;
      console.log('distance: ', distance.toString());
      res.send({distance: distance});
    })
    .catch(next);

})
.get('/airports/v2', (req, res, next) => {
  //get all airports
  const query = req.query || {};
  
  Airport.find(query)
    .lean()
    .then(airports => {
      let filtered = airports.map(airport => {
        return {code: airport.code, name: airport.name, city: airport.city, country: airport.country, lat: airport.lat, lng: airport.lng};
      });
      res.send(filtered);
    })
    .catch(next);
});