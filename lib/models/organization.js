'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Organization = new Schema({
  name: {
    type: String,
    required: true
  },
  img: String
}, {timestamps: true});

module.exports = mongoose.model('Organization', Organization);