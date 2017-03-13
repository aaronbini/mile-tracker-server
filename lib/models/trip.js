'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Trip = new Schema({
  name: {
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
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  confirmedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {timestamps: true});

//add static method checks if user is in users AND NOT in confirmedUsers
Trip.statics.getUnconfirmed = function (id) {
  return this.find({
    users: id,
    confirmedUsers: {$nin: [id]}
  });
};

module.exports = mongoose.model('Trip', Trip);