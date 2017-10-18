'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const User = new Schema({
  email: {
    type:String,
    required: true
  },
  username: {
    type: String
  },
  password: {
    type:String,
    required: true
  },
  role: {
    type: String,
    default: 'base'
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
}, {timestamps: true});

User.methods.generateHash = function(password){
  return this.password = bcrypt.hashSync(password, 8);
};

User.methods.compareHash = function(password){
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', User);