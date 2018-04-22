'use strict';

const express = require('express');
const router = express.Router();
const bodyparser = require('body-parser').json();
const ensureRole = require('../auth/ensureRole');
const User = require('../models/user');

module.exports = router

.get('/', (req,res,next) => {
  //filter by orgId
  User.find({ organization: req.user.organization })
  .lean()
  .select('-password')
  .then(users => res.send(users))
  .catch(next);
})

.get('/byID', (req,res,next) => {
  User.findById(req.user.id)
    .populate({path: 'organization', select: '-_id'})
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
//for use by org admin to make changes to a users org
.put('/org', ensureRole('superUser'), bodyparser, (req, res, next) => {
  const { org } = req.body;
  User.update({}, { $set: { organization: org } }, { multi: true})
  .then(() => res.send('Successfully updated org for all users'))
  .catch(next);
})

.delete('/:id', ensureRole('superUser'), (req,res,next) => {
  User.findByIdAndRemove(req.params.id)
  .lean()
  .select('-password')
  .then(user => res.send(user))
  .catch(next);
});