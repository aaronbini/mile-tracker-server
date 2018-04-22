'use strict';

const express = require('express');
const router = express.Router();
const bodyparser = require('body-parser').json();
const Trip = require('../models/trip');
const Movement = require('../models/movement');
const ensureRole = require('../auth/ensureRole');
const emissionsCalc = require('../emissions');

module.exports = router
  .get('/', ensureRole('superUser'), (req,res,next) => {
    //get all trips and associated movements, only admin can hit this endpoint
    //this needs to be done on a per org basis
    const query = req.query || {};
    let totalTrips;
    
    Trip.find(query)
      .lean()
      .populate('users', 'email username')
      .then(trips => {
        totalTrips = trips.filter(trip => {
          //look into first user, check org
          if (trip.users) {
            const org = trip.users[0].organization;
            return org === req.user.organization;
          } else {
            return false;
          }
        });
        
        let promises = totalTrips.map(trip => Movement.find({trip: trip._id}));
        return Promise.all(promises);
      })
      .then(movementsArray => {
        movementsArray.forEach((movements, index) => {
          totalTrips[index].movements = movements;
        });
        res.send(totalTrips);
      })
      .catch(next);
  })
  //get all trips by employee and attach all movements associated with each trip
  .get('/byEmployee', (req, res, next) => {
    let userTrips;
    Trip.find({ confirmedUsers: req.user.id })
      .lean()
      .then(trips => {
        userTrips = trips;
        let promises = trips.map(trip => Movement.find({trip: trip._id}));
        return Promise.all(promises);
      })
      .then(movements => {
        //movements will be array of arrays
        movements.forEach((tripMovements, index) => {
          //attach all movements to the trip
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
      Trip.findById(req.params.id).populate('users').lean(),
      Movement.find({trip: req.params.id})
    ])
    .then(([trip, movements]) => {
      trip.movements = movements;
      let emissions = emissionsCalc(movements);
      res.send({ trip, emissions} );
    })
    .catch(next); 
  })
  .get('/unconfirmed', (req, res, next) => {
    Trip.getUnconfirmed(req.user.id)
      .then(trips => res.send(trips))
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

  .put('/:id', bodyparser, ensureRole('superUser'), (req,res,next) => {
    Trip.findByIdAndUpdate(req.params.id, req.body, {new:true})
    .then(trip => res.send(trip))
    .catch(next);
  })

  .delete('/:id', ensureRole('superUser'), (req,res,next) => {
    Trip.findByIdAndRemove(req.params.id)
    .then(trip => res.send(trip))
    .catch(next);
  })
  //combine these two endpoints into one
  .put('/removeTravelers/:id', bodyparser, (req, res, next) => {
    Trip.findByIdAndUpdate(req.params.id, { $pull: { users: req.body.subtract } }, { new: true })
      .then(trip => res.send(trip))
      .catch(next);
  })
  .put('/addTravelers/:id', bodyparser, (req, res, next) => {
    Trip.findByIdAndUpdate(req.params.id, {$push: { users: req.body.add } }, { new: true })
      .then(trip => res.send(trip))
      .catch(next);
  })
  .put('/changeDestination/:id', bodyparser, (req, res, next) => {
    Trip.findByIdAndUpdate(req.params.id, { destination: req.body.destination }, { new: true })
      .then(trip => res.send(trip))
      .catch(next);
  });