'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const User = new Schema({
  email: {
    type:String,
    required: true
  },
  password: {
    type:String,
    required: true
  },
  role: {
    type: String,
    default: 'base'
  }
}, {timestamps: true});

User.methods.generateHash = function(password){
  return this.password = bcrypt.hashSync(password, 8);
};

User.methods.compareHash = function(password){
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', User);