'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActionItem = new Schema({
  description: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  trip: {
    type: Schema.Types.ObjectId,
    ref: 'Trip'
  }
}, {timestamps: true});

module.exports = mongoose.model('ActionItem', ActionItem);
