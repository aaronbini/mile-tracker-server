'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Trip = new Schema({
  departure: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalMiles: {
    type: Number,
    required: true,
    default: 0
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {timestamps: true});

module.exports = mongoose.model('Trip', Trip);