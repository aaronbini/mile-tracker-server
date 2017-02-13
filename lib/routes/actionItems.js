'use strict';

const express = require('express');
const router = express.Router();
const bodyparser = require('body-parser').json();
const ActionItem = require('../models/actionItem');
const ensureRole = require('../auth/ensureRole');

module.exports = router
  .get('/', ensureRole('superUser'), (req,res,next) => {
    ActionItem.find()
      .sort({createdAt: -1})
      .lean()
      .then(actionItems => res.send(actionItems))
      .catch(next);
  })
  .post('/', bodyparser, (req, res, next) => {
    ActionItem.save(req.body)
      .then(actionItem => res.send(actionItem))
      .catch(next);
  })
  .put('/:id', ensureRole('superUser'), bodyparser, (req, res, next) => {
    ActionItem.findByIdAndUpdate(req.body, req.params.id, { new: true })
      .then(actionItem => res.send(actionItem))
      .catch(next);
  });