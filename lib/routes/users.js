'use strict';

const express = require('express');
const router = express.Router();
const bodyparser = require('body-parser').json();
const ensureRole = require('../auth/ensureRole');
const User = require('../models/user');

module.exports = router

.get('/', ensureRole('superUser'), (req,res,next) => {
  //only admin can get all users
  User.find()
  .lean()
  .select('-password')
  .then (users => res.send(users))
  .catch(next);
})

.get('/byID', (req,res,next) => {
  User.findById(req.user.id)
    .select('-password')
    .then(user => res.send(user))
  .catch(next);
})

.put('/', bodyparser, (req,res,next) => {
  User.findByIdAndUpdate(req.user.id, req.body, {new:true})
  .lean()
  .select('-password')
  .then(user => res.send(user))
  .catch(next);
})

.delete('/', (req,res,next) => {
  User.findByIdAndRemove(req.user.id)
  .lean()
  .select('-password')
  .then(user => res.send(user))
  .catch(next);
});