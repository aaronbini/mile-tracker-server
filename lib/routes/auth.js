'use strict';

const express = require('express');
const router = express.Router();
const bodyparser = require('body-parser').json();
const ensureAuth = require('../auth/ensureAuth');
const ensureEmployee = require('../auth/ensureEmployee');
const token = require('../auth/token.js');
const User = require('../models/user');

module.exports = router

.post('/signup', bodyparser, ensureEmployee, (req, res, next) => {
  const {email, password} = req.body;
  delete req.body.password;

  if(!email || !password) {
    return res.status(400).send({message: 'All fields are required.'});
  }

  User.findOne({email})
    .then(existing => {
      if(existing) return res.status(500).send({message: 'That email is already in use.'});
      const user = new User(req.body);
      user.generateHash(password);
      return user.save()
      .then(user => {
        return token.sign(user);
      })
      .then(token => {
        res.send({token});
      });
    })
    .catch(next);
})

.post('/signin', bodyparser, ensureEmployee, (req, res, next) => {
  const {email, password} = req.body;
  delete req.body;

  User.findOne({email})
    .then(user => {
      if(!user || !user.compareHash(password)) throw {status: 400, message: 'Invalid email or password.'};
      return token.sign(user)
      .then(token => {
        res.send({token});
      });
    })
    .catch(next);
})

.get('/verify', ensureAuth, (req, res) => {
  res.status(200).send({success: true});
});