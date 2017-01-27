'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Movement = new Schema({
  mode: {
    type: String,
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  trip: {
    type: Schema.Types.ObjectId,
    ref: 'Trip'
  }
}, {timestamps: true});

module.exports = mongoose.model('Movement', Movement);