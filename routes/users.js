const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
//User model
const User = require('../models/User');
const Client = require('../models/Client');
const RegistrationKey = require('../models/RegistrationKey');

//Login Page
router.get('/login', (req,res) => res.render("login"));

//New Client
router.get('/newClient', (req,res) => res.render("newClient"));

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

//New BuildingSchema
router.get('/newBuilding', (req,res) => res.render("newBuilding"));

//New Employee
router.get('/newEmployee', (req,res) => res.render("newEmployee"));

//Register Page
router.get('/register', (req,res) => res.render("register"));

//Register Handle
router.post('/register', (req, res) => {
  const { name, email, password, password2, registrationKey } = req.body;
  let errors = [];

  //Check required fields
  if(!name || !email || !password || !password2) {
    errors.push({msg: 'Please fill in all fields'});
  }
  //Check passwords match
  if(password !== password2) {
    errors.push({msg: 'Passwords do not match'});
  }
  //Check pass length
  if(password.length < 6) {
    errors.push({msg : 'Password should be at least 6 characters'});
  }
  //Check if the registrationKey matches one in the database
  RegistrationKey.findOneAndUpdate({key: registrationKey},{$inc:{'numUsed':1}})
  .then(key => {
    if(key) {
      console.log("key matched");
      console.log("Received data: " + key);
      console.log("Received as " + typeof(key));
      //if any errors, dont leave page
      if(errors.length>0){
        //dont continue
        res.render('register', {
          errors,
          name,
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
              name,
              email,
              password,
              password2,
              registrationKey
            });
          } else {
            const role = key.role;
            const privilege = key.privilege;
            console.log("adding user with role " + role);
            const newUser = new User({
              name,
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
        name,
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
