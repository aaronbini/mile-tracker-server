'use strict';

const express = require('express');
const router = express.Router();
const Trip = require('../models/trip');
const Movement = require('../models/movement');
const emissionsCalc = require('../emissions');
const ensureRole = require('../auth/ensureRole');

function splitTrip (distance, num) {
  //split trip with multiple travelers for emissions calculations
  return distance / num;
}

function aggregateMiles(accumulator, movement) {
  const rounded = Math.round(movement.distance);
  switch (movement.mode) {
  case 'car':
    accumulator.car += rounded;
    break;
  case 'air':
    accumulator.air += rounded;
    break;
  case 'bus':
    accumulator.bus += rounded;
    break;
  case 'train':
    accumulator.train += rounded;
    break;
  default:
    accumulator.car += rounded;
  }
  accumulator.total += rounded;
  return accumulator;
}

module.exports = router
  .get('/', (req, res, next) => {
    //TODO: restrict this by org
    Movement.find()
      .then(movements => res.send(movements))
      .catch(next);
  })

  .get('/companyTotals', (req, res, next) => {
    const { organization } = req.user;
    //aggregate mileage totals across the company
    // Movement.aggregate([
    //   { $group: { _id: '$mode', total: { $sum: '$distance'} } }
    // ])
    // .then(agg => res.send(agg))

    //date query
    //const { start, end } = req.query;
    //'createdAt': {'$gte': new Date(start), '$lt': new Date(end)}
    
    Movement.find({})
      .populate({
        path: 'trip',
        populate: { path: 'users' }
      })
      .then(movements => {
        const filteredByOrg = movements.filter(movement => {
          if (movement.trip) {
            return movement.trip.users[0].organization == organization;
          }
          return false;
        });
        res.send(filteredByOrg.reduce(aggregateMiles, { air: 0, car: 0, bus: 0, train: 0, total: 0 }));
      })
    .catch(next);
  })

  .get('/companyEmissions', (req, res, next) => {
    const { organization } = req.user;
    Movement.find({})
      .populate({
        path: 'trip',
        populate: { path: 'users' }
      })
      .then(movements => {
        const filteredByOrg = movements.filter(movement => {
          if (movement.trip) {
            return movement.trip.users[0].organization == organization;
          }
          return false;
        });
        //do emissions calculations
        let emissionsAccumulator = emissionsCalc(filteredByOrg);
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
              array.forEach(movement => {
                movement.distance = splitTrip(movement.distance, tripsArray[index].confirmedUsers.length);
              });
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
  })

  .delete('/:id', ensureRole('superUser'), (req, res, next) => {
    Movement.findByIdAndRemove(req.params.id)
    .then(movement => res.send(movement))
    .catch(next);
  });