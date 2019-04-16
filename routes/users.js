const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {ensureAuthenticated} = require('../config/auth');

//Models
const Job = require('../models/Job');
const Building = require('../models/Building');
const Entry = require('../models/Entry');
const User = require('../models/User');
const Client = require('../models/Client');
const RegistrationKey = require('../models/RegistrationKey');

function initPackage(req) {

  var {filterBy,filterValue} = req.body;
  var package = {
    'firstName': req.user.firstName,
    'lastName': req.user.lastName,
    'privilege': req.user.privilege,
  }

  if (filterBy == undefined) {
    filterBy = 'none';
    filterValue = 'none';
  }
  if (filterValue == undefined) {
    filterBy = 'none';
    filterValue = 'none';
  }
  if (req.user.privilege == 'user') {
    filterBy = 'Employee';
    filterValue = req.user.firstName + ' ' + req.user.lastName;
  }
  package.filterBy = filterBy;
  package.filterValue = filterValue;
  return package;

}

//New Job
router.get('/newJob', ensureAuthenticated, (req,res) => {
  res.render('newJob');
});

router.post('/newJob', ensureAuthenticated, (req,res) => {
  const {jobName} = req.body;
  console.log("Making job with name " + jobName)
  var errors = [];
  if (jobName == "") {
    errors.push({msg: 'Please fill in all fields'});
  }
  if(errors.length > 0) {
    res.render('newJob', {
      errors
    });
  } else {
    creator = req.user._id.toString();
    entries = []
    complete = false

    const newJob = new Job({
      jobName,
      creator,
      entries,
      complete
    });

    newJob.save()
      .then(user => {
        req.flash('success_msg', 'You successfully added a Job!');
        res.redirect('/dashboard');
      })
      .catch(err => console.log(err));
  }
});

//Filter Page
router.post('/filterPage', ensureAuthenticated, (req,res) => {
  var {filterBy,filterValue} = req.body;
  package = initPackage(req);
  package.filterBy = filterBy;
  package.filterValue = filterValue;
  console.log(filterValue);
  Building.find({}, function(err, buildings) {
    User.find({}, function(err, employees) {
      Entry.find({}, function(err, entries) {
        console.log('Rendering dashboard with fiterbBy: ' + package.filterBy + ' and filterValue: ' + package.filterValue);
        res.render('dashboard',{package:package,allEmployees:employees,buildings:buildings,entries:entries});
      });
    });
  });
});

router.get('/filterPage', ensureAuthenticated, (req,res) => {
  console.log("Called filterPage with GET");
  var param = req.query.param
  var package = {
    'firstName': req.user.firstName,
    'lastName': req.user.lastName,
    'privilege': req.user.privilege,
  }
  console.log('received filter param: ' + param);
  if (param == 'Room') {
    console.log('Loading filterBy with params of room');
    Entry.find({}, function(err, data) {

      result = [];
      data.forEach(function(item) {
        var found = false;
        for (var i=0;i<result.length;i++) {
          if (result[i] == item.room) {
            found = true;
          }
        }
        if (!found) {
          result.push(item.room);
        }
      });
      res.render('filterPage',{
        result:result,
        package:package,
        param:param
      });
    });
  }
  if (param == 'Employee') {
    console.log('Loading filterBy with params of employee');
    Entry.find({}, function(err, data) {
      result = [];
      data.forEach(function(item) {
        var found = false;
        for (var i=0;i<result.length;i++) {
          if (result[i] == item.firstName + " " + item.lastName) {
            found = true;
          }
        }
        if (!found) {
          result.push(item.firstName + " " + item.lastName);
        }
      });
      res.render('filterPage',{
        result:result,
        package:package,
        param:param
      });
    });
  }
  if (param == 'Job') {
    console.log("Loading filterBY with params of job");
    result = [];
    var query = Job.find({}).select('jobName complete');
    query.exec(function (err, jobData){
      jobData.forEach(function(item){
        console.log("Viewind " + item);
        var string = item.jobName;
        if (item.complete) {
          string += " (COMPLETE)";
        } else {
          string += " (NOT COMPLETE)";
        }
        console.log("Pushing to result " + string);
        result.push(string);
      });
      console.log("Result " + result);
      res.render('filterPage',{
        result:result,
        package:package,
        param:param
      });
    });
  }
});

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

  function isValidDate(s) {
    var bits = s.split('/');
    var d = new Date(bits[2], bits[1] - 1, bits[0]);
    return d && (d.getMonth() + 1) == bits[1];
  }

  var {regHours,otHours,room,building,note,firstName,lastName,complete,datePerformed,jobName} = req.body;

  let errors = [];
  if(room == ""){
    errors.push({msg: 'Please fill in a room number'});
  }
  if (datePerformed == "") {
    errors.push({msg: 'Please fill in a date'});
  }
  if (isValidDate(datePerformed)) {
    //valid date
  } else {
    errors.push({msg: 'Please enter the date in this format: MM/DD/YYYY'});
  }
  if(errors.length > 0) {
    for (var i=0;i<errors.length;i++){
      req.flash('success_msg', errors[i].msg);
    }
    res.redirect('/dashboard');
  } else {
    complete = false; // entries are marked complete when the job they are associated with is marked complete
    const newEntry = new Entry({
      datePerformed,
      regHours,
      otHours,
      room,
      building,
      note,
      complete,
      firstName,
      lastName,
      jobName
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
