'use strict';

const express = require('express');
const router = express.Router();
const bodyparser = require('body-parser').json();
const ensureAuth = require('../auth/ensureAuth');
const ensureEmployee = require('../auth/ensureEmployee');
const token = require('../auth/token.js');
const User = require('../models/user');
const Organization = require('../models/organization');
const helper = require('sendgrid').mail;
const sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
const crypto = require('crypto');
const { promisify } = require('util');
const cryptoPromise = promisify(crypto.randomBytes);
const nodeMailer = require('nodemailer');
const ensureRole = require('../auth/ensureRole');
const setOrg = require('../auth/setOrg');

module.exports = router
.post('/signup', bodyparser, (req, res, next) => {
  const {email, password} = req.body;
  const orgToken = req.body.token;
  req.body.username = email.split('@')[0];
  delete req.body.password;

  if(!email || !password) {
    return res.status(400).send({message: 'All fields are required.'});
  }
  let orgId;
  const orgName = setOrg(orgToken);
  console.log('org name: ', orgName);
  Organization.findOne({ name: orgName })
    .then(org => {
      if (!org) throw { code: 403, message: 'Error with signup request' };
      orgId = org._id;
    })
    .then(() => {
      return User.findOne({email});
    })
    .then(existing => {
      if(existing) throw { code: 403, message: 'That email is already in use.' };
      const user = new User(req.body);
      user.organization = orgId;
      user.generateHash(password);
      return user.save()
      .then(user => {
        return token.sign(user);
      })
      .then(jwtToken => {
        res.send({ token: jwtToken });
      });
    })
    .catch(next);
})

.post('/signin', bodyparser, (req, res, next) => {
  const {email, password} = req.body;
  delete req.body;

  User.findOne({email})
    .then(user => {
      if(!user || !user.compareHash(password)) throw { code: 400, message: 'Invalid email or password.'};
      return token.sign(user)
      .then(token => {
        res.send({token});
      });
    })
    .catch(next);
})

.get('/org', ensureAuth, ensureRole('superUser'), (req, res, next) => {
  Organization.find()
    .then(orgs => res.send(orgs))
    .catch(next);
})

.post('/org', ensureAuth, ensureRole('superUser'), bodyparser, (req, res, next) => {
  const {name} = req.body;
  Organization.findOne({name})
    .then(existing => {
      if(existing) return res.status(500).send({message: 'Organization name already exists.'});
      const org = new Organization(req.body);
      return org.save()
      .then(org => {
        res.send({org});
      });
    })
    .catch(next);
})

.put('/org', ensureAuth, ensureRole('superUser'), bodyparser, (req, res, next) => {
  const { imgPath, orgId } = req.body;
  Organization.findByIdAndUpdate(orgId, { $set: { img: imgPath }}, { new: true })
    .then(updatedOrg => res.send(updatedOrg));
})

.post('/forgot', bodyparser, (req, res, next) => {
  const {email} = req.body;
  let encryptedToken;
  let passwordChangeUser;
  cryptoPromise(20).then(token => token.toString('hex'))
    .then(token => {
      encryptedToken = token;
      return User.findOne({email});
    })
    .then(user => {
      if (!user) {
        throw {status: 400, message: 'Invalid email or password.'};
      }
      user.resetPasswordToken = encryptedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      return user.save();
    })
    .then(user => {
      passwordChangeUser = user;
      var smtpTransport = nodeMailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env['SENDGRID_USERNAME'],
          pass: process.env['SENDGRID_PASSWORD']
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'norepyly-passwordreset@ee-mile-tracker.herokuapp.com',
        subject: 'Travel Tracker Password Reset',
        text: `You are receiving this because you have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\nhttps://${req.headers.host}/#/reset/${encryptedToken} \n\nIf you do not wish to change your password at this time, ignore this email and your password will remain unchanged.\n`
      };
      //according to docs, if there is no callback, method returns a Promise
      return smtpTransport.sendMail(mailOptions);
    })
    .then(() => res.send({ message: `An e-mail has been sent to ${passwordChangeUser.email} with further instructions.` }))
    .catch(next);
})

.get('/reset/:token', (req, res, next) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
    .then(user => {
      if (!user) {
        res.send({success: false, message: 'Password reset token is invalid or has expired.'});
        // throw {status: 400, message: 'Password reset token is invalid or has expired.'};
      } else {
        res.send({success: true});
      }
    })
    .catch(next);
})

//this will get hit after the user receives the email to reset password
//user will have already navigated to a page in the app
.post('/updatePassword', bodyparser, (req, res, next) => {
  const {email, newPass} = req.body;
  delete req.body;

  User.findOne({email})
    .then(user => {
      user.generateHash(newPass);
      return user.save();
    })
    .then(() => {
      //send a success message
      res.send({message: 'Password successfully updated'});
    })
    .catch(next);
})

.get('/verify', ensureAuth, (req, res) => {
  res.status(200).send({success: true});
});