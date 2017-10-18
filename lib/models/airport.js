'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Airport = new Schema({
  code: {
    type: String
  },
  name: {
    type: String
  },
  city: {
    type: String
  },
  country: {
    type: String
  },
  lat: {
    type: Number
  },
  lng: {
    type: Number
  },
  timezone: {
    type: String
  },
  terminal: {
    type: String
  },
  gate: {
    type: String
  }
}, {timestamps: true});

module.exports = mongoose.model('Airport', Airport);
