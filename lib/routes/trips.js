'use strict';

const express = require('express');
const router = express.Router();
const bodyparser = require('body-parser').json();
const Trip = require('../models/trip');
const Movement = require('../models/movement');
const ensureRole = require('../auth/ensureRole');

module.exports = router
.get('/', ensureRole('superUser'), (req,res,next) => {
  //get all trips, only admin can hit this endpoint
  //could query by date
  const query = req.query || {};
  Trip.find(query)
    .lean()
    .then(trips => {
      res.send(trips);
    })
    .catch(next);
})
//get all trips by employee and attach all movements associated with each trip
.get('/byEmployee', (req, res, next) => {
  //pull in emissions calculator module and user here
  //send userEmissions as part of response
  let userTrips, userEmissions;
  //{ confirmedUsers: { $in: [ req.user.id ] } }
  Trip.find({ confirmedUsers: req.user.id })
    .then(trips => {
      userTrips = trips;
      let promises = trips.map(trip => Movement.find({trip: trip._id}));
      return Promise.all(promises);
    })
    .then(movements => {
      //movements will be array of arrays
      movements.forEach((tripMovements, index) => {
        //attach all movements to the trip
        userTrips[index] = userTrips[index].toObject();
        userTrips[index].movements = tripMovements;
      });
      //send all of user's populated trips
      res.send(userTrips);
    })
    .catch(next);
})
//get individual trip and attach all movements
.get('/byTrip/:id', (req,res,next) => {
  Promise.all([
    Trip.findById(req.params.id).lean(),
    Movement.find({trip: req.params.id})
  ])
  .then(([trip, movements]) => {
    trip.movements = movements;
    res.send(trip);
  })
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
.get('companyEmissions', (req, res, next) => {

})
.get('/unconfirmed', (req, res, next) => {
  Trip.getUnconfirmed(req.user.id)
    .then(trips => res.send(trips))
    .catch(next);
})
.get('/movements', (req, res, next) => {
  Movement.find()
    .then(movements => res.send(movements))
    .catch(next);
})
//POST will occur with trip and associated movements
//movements will be saved here and attached to trip
.post('/', bodyparser, (req, res, next) => {
  req.body.trip.users.push(req.user.id);
  req.body.trip.confirmedUsers = [req.user.id];
  let movements = req.body.trip.movements;
  let savedTrip;
  new Trip(req.body.trip)
   .save()
   .then(trip => {
     //cannot add properties to Mongoose objects
     //so this is necessary here
     savedTrip = trip.toObject();
     let promises = movements.map(movement => {
       movement.trip = savedTrip._id;
       return new Movement(movement).save();
     });
     return Promise.all(promises);
   })
   .then(savedMovements => {
     let savedMovementsObj = savedMovements;
     savedTrip.movements = savedMovementsObj;
     res.send(savedTrip);
   })
   .catch(next);
})

.put('/addUser/:id', bodyparser, (req, res, next) => {
  Trip.findByIdAndUpdate(req.params.id, { $push: {confirmedUsers: req.user.id} }, { new: true } )
    .then(trip => res.send(trip))
    .catch(next);
})

.put('/:id', bodyparser, (req,res,next) => {
  Trip.findByIdAndUpdate(req.params.id, req.body, {new:true})
  .then(trip => res.send(trip))
  .catch(next);
})

.delete('/:id', (req,res,next) => {
  Trip.findByIdAndRemove(req.params.id)
  .then(trip => res.send(trip))
  .catch(next);
});