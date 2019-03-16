const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {ensureAuthenticated} = require('../config/auth');
//User model
const Building = require('../models/Building');
const Entry = require('../models/Entry');
const User = require('../models/User');
const Client = require('../models/Client');
const RegistrationKey = require('../models/RegistrationKey');

//Login Page
router.get('/login', (req,res) => res.render("login"));

router.get('/loadEntries', (req,res) => {
  Entry.find({}, function(err, data) {
      res.render('loadEntries',{result:data});
    });
});

//New Client
router.get('/newClient',ensureAuthenticated, (req,res) => {
  firstName = req.user.firstName
  res.render('newClient',{firstName:firstName});
});
router.post('/newClient', (req,res) => {

  const {name} = req.body;
  let errors = [];
  if(name == ""){
    errors.push({msg: 'Please fill in all fields'});
  }
  if(errors.length > 0) {
    res.render('newClient', {
      errors,
      name
    });
  } else {
    const newClient = new Client({
      name
    });
    newClient.save()
      .then(user => {
        req.flash('success_msg', 'You successfully added a client!');
        res.redirect('/dashboard');
      })
      .catch(err => console.log(err));
  }

});

//New Entry
router.get('/newEntry',ensureAuthenticated, (req,res) => {
  Building.find({}, function(err, data) {
    res.render('newEntry',{result:data,firstName:req.user.firstName,lastName:req.user.lastName});
  });
});

router.post('/newEntry', (req,res) => {
  var {regHours,otHours,room,building,note,firstName,lastName, complete} = req.body;

  if (complete == "Yes") {
    complete = true;
  } else {
    complete = false;
  }
  let errors = [];
  if(room == ""){
    errors.push({msg: 'Please fill in a room number'});
  }
  if(errors.length > 0) {
    res.render('newEntry', {
      errors
    });
  } else {
    const newEntry = new Entry({
      regHours,
      otHours,
      room,
      building,
      note,
      complete,
      firstName,
      lastName
    });
    newEntry.save()
      .then(user => {
        req.flash('success_msg', 'You successfully added an entry!');
        res.redirect('/dashboard');
      })
      .catch(err => console.log(err));
  }
});

//New Building
router.get('/newBuilding',ensureAuthenticated, (req,res) => {
  firstName = req.user.firstName
  Client.find({}, function(err, data) {
    res.render('newBuilding',{result:data,firstName:firstName});
  });
});

router.post('/newBuilding', (req,res) => {
  const{name,address,client} = req.body;

  let errors = [];
  if(name == ""){
    errors.push({msg: 'Please fill in a name'});
  }
  if(address == ""){
    errors.push({msg: 'Please fill in an address'});
  }
  if(errors.length > 0) {
    res.render('newBuilding', {
      errors,
      name,
      address
    });
  } else {
    const newBuilding = new Building({
      name,
      address,
      client
    });
    newBuilding.save()
      .then(user => {
        req.flash('success_msg', 'You successfully added a building!');
        res.redirect('/dashboard');
      })
      .catch(err => console.log(err));
    }
});

//Register Handle
router.get('/register', (req, res) => res.render('register'));

router.post('/register', (req, res) => {
  const { firstName, lastName, email, password, password2, registrationKey } = req.body;
  let errors = [];

  //Check required fields
  if(!firstName || !lastName || !email || !password || !password2) {
    errors.push({msg: 'Please fill in all fields'});
  }
  //Check passwords match
  if(password !== password2) {
    errors.push({msg: 'Passwords do not match'});
  }
  //Check pass length
  if(password.length < 8) {
    errors.push({msg : 'Password should be at least 8 characters'});
  }
  //Check if the registrationKey matches one in the database
  RegistrationKey.findOneAndUpdate({key: registrationKey},{$inc:{'numUsed':1}})
  .then(key => {
    if(key) {
      console.log("key matched");
      //if any errors, dont leave page
      if(errors.length>0){
        //dont continue
        res.render('register', {
          errors,
          firstName,
          lastName,
          email,
          password,
          password2,
          registrationKey
        });
      } else {
        //Validation passed
        User.findOne({email: email})
        .then(user => {
          if(user) {
            //User exists
            errors.push({msg: 'Email is already registered'});
            res.render('register', {
              errors,
              firstName,
              lastName,
              email,
              password,
              password2,
              registrationKey
            });
          } else {
            const role = key.role;
            const privilege = key.privilege;
            const newUser = new User({
              firstName,
              lastName,
              role,
              privilege,
              email,
              password
            });
            //Hash Password
            bcrypt.genSalt(10, (err, salt) =>
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if(err) throw err;
                //Set password to hashed
                newUser.password = hash;
                //Save user
                newUser.save()
                  .then(user => {
                    req.flash('success_msg', 'You are now registered and can log in');
                    res.redirect('/users/login');
                  })
                  .catch(err => console.log(err));
              }))
          }
        });
      }
    } else {
      errors.push({msg:"Invalid registration key"});
      res.render('register', {
        errors,
        firstName,
        lastName,
        email,
        password,
        password2,
        registrationKey
      });
      console.log("key did not match");
    }
  });
});

//login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  }) (req, res, next);
});

//logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You have logged out');
  res.redirect('/users/login');
});

module.exports = router;
