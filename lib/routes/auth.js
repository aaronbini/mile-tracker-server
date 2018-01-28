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

module.exports = router
.post('/signup', bodyparser, ensureEmployee, (req, res, next) => {
  const {email, password} = req.body;
  req.body.username = email.split('@')[0];
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

.post('/org', bodyparser, (req, res, next) => {
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

.post('/updatePassword', bodyparser, (req, res, next) => {
  //this will get hit after the user receives the email to reset password
  //user will have already navigated to a page in the app
  //send back success message at this point to be dealt with in UI
  let email;
  const password = req.body.password;
  delete req.body.password;
  User.findById(req.user.id)
    .then(user => {
      email = user.email;
      user.generateHash(password);
      return user.save();
    })
    .then(user => {
      //send a success message
      res.send({message: 'Password successfully updated'});
    })
    .catch(next);
})

.get('/requestPasswordUpdate', ensureAuth, (req, res) => {
  const from_email = new helper.Email('test@example.com');
  const to_email = new helper.Email('bini.aaron@gmail.com');
  const subject = 'Hello World from the SendGrid Node.js Library!';
  const content = new helper.Content('text/plain', 'Hello, Email!');
  const mail = new helper.Mail(from_email, subject, to_email, content);

  
  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });
  
  sg.API(request)
    .then(response => {
      console.log(response.statusCode);
      console.log(response.body);
      console.log(response.headers);
    })
    .catch(error => {
      //error is an instance of SendGridError
      //The full response is attached to error.response
      console.log('error: ', error.response.body.errors[0]);
    });
})

.post('/forgot', bodyparser, (req, res, next) => {
  const {email} = req.body;
  let encryptedToken;
  let passwordChangeUser;
  cryptoPromise(20).then(token => token.toString('hex'))
    .then(token => {
      encryptedToken = token;
      console.log('encryptedToken: ', token);
      return User.findOne({email});
    })
    .then(user => {
      console.log('user: ', user);
      if (!user) {
        throw {status: 400, message: 'Invalid email or password.'};
      }
      user.resetPasswordToken = encryptedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      console.log('user resetToken: ', user.resetPasswordToken)
      console.log('user resetPassword: ', user.resetPasswordExpires)
      return user.save();
    })
    .then(user => {
      console.log('second user: ', user);
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
        from: 'passwordreset@ee-mile-tracker.herokuapp.com',
        subject: 'Travel Tracker Password Reset',
        text: `You are receiving this because you have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\nhttps://${req.headers.host}/reset/${encryptedToken} \n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
      //according to docs, if there is no callback, method returns a Promise
      return smtpTransport.sendMail(mailOptions);
    })
    .then(() => res.send({ message: `An e-mail has been sent to ${passwordChangeUser.email} with further instructions.` }))
    .catch(next);
})

.get('/verify', ensureAuth, (req, res) => {
  res.status(200).send({success: true});
});