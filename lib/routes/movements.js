'use strict';

const express = require('express');
const router = express.Router();
const Trip = require('../models/trip');
const Movement = require('../models/movement');
const emissionsCalc = require('../emissions');

function splitTrip (distance, num) {
  //split trip with multiple travelers for emissions calculations
  return distance / num;
}

module.exports = router
  .get('/', (req, res, next) => {
    Movement.find()
      .then(movements => res.send(movements))
      .catch(next);
  })
  .get('/companyTotals', (req, res, next) => {
    //aggregate mileage totals across the company
    Movement.aggregate([
      { $group: { _id: '$mode', total: { $sum: '$distance'} } }
    ]).then(movements => {
      res.send(movements);
    })
    .catch(next);
  })
  .get('/companyEmissions', (req, res, next) => {
    Movement.find()
      .then(movements => {
        //do emissions calculations
        let emissionsAccumulator = emissionsCalc(movements);
        res.send(emissionsAccumulator);
      })
      .catch(next);

  })
  .get('/soloEmissions', (req, res, next) => {
    let tripsArray = [];
    Trip.find({ confirmedUsers: req.user.id })
      .then(trips => {
        tripsArray = trips.map(trip => {
          return trip.toObject();
        });
        let promises = tripsArray.map(trip => Movement.find({trip: trip._id}));
        Promise.all(promises)
          .then(movementArrays => {
            //array of arrays: [ [ {movement1}, {movement2} ], [ {movement1} ] ]
            movementArrays.forEach((array, index) => {
              //need to split trip at this point before arrays are flattened
              console.log('array before trip split: ', array);
              array.forEach(movement => {
                movement.distance = splitTrip(movement.distance, tripsArray[index].confirmedUsers.length);
              });
              console.log('array after split: ', array);
            });
            let flattenedArray = movementArrays.reduce((flattened, movements) => {
              return flattened.concat(...movements);
            }, []);
            
            let emissionsAccumulator = emissionsCalc(flattenedArray);
            res.send(emissionsAccumulator);
          })
          .catch(next);

      })
      .catch(next);
  });