const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {ensureAuthenticated} = require('../config/auth');
var mongoose = require('mongoose');

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

//View Job Hours
router.get('/viewHours', ensureAuthenticated, (req,res) => {
  //make a list for the results
  jobs = [];
  //view all of the entries
  var jobQuery = Job.find({}).populate('buildingID');
  billables = [];
  jobQuery.exec(function(err,jobs){
    jobs.forEach(function(job){
      var jobRegHours = 0;
      var jobOTHours = 0;
      var entryQuery = Entry.find({jobID: job._id}).select('regHours otHours');
      entryQuery.exec(function(err, entries){
        entries.forEach(function(entry) {
          jobRegHours += entry.regHours;
          jobOTHours += entry.otHours;
        });
        var buildingQuery = Building.findOne({_id : job.buildingID}).select('name clientID');
        buildingQuery.exec(function(err, building){
          //job hours are totaled here
          console.log("in building " + job.name + " job Hours: " + (jobRegHours + jobOTHours));
          var clientQuery = Client.findOne({_id: building.clientID});
          clientQuery.exec(function(err,client){
            billableJob = {
              'name' : job.name,
              'regHours' : jobRegHours,
              'otHours' : jobOTHours,
              'totalHours' : jobRegHours + (1.5 * jobOTHours),
              'complete' : job.complete,
              'buildingName' : building.name,
              'clientName' : client.name
            }
            billables.push(billableJob);
            if (billables.length == jobs.length) {
              console.log("Rendering viewJobs");
              res.render('viewHours',{billables});
            }
          });
        });
      });
    });
  });
});

//Close Job
router.get('/closeJob', ensureAuthenticated, (req,res) => { 
  jobNames = []
  jobIDs = []
  Job.find({}, function(err,allJobs) { 
    allJobs.forEach(function(job){
      if (!job.complete) {
        jobNames.push(job.name);
        jobIDs.push(job._id);
      }
    });
    res.render('closeJob',{jobNames, jobIDs});
  });
});

router.post('/closeJob', ensureAuthenticated, (req,res) => { 
  const {closeJob} = req.body;
  console.log("Received closeJob with " + closeJob);
  Job.updateMany({ _id: closeJob}, {complete: true}, function(err,data) {
      req.flash('success_msg', 'You successfully closed a Job!');
      res.redirect('/dashboard');
  });
});

//New Job
router.get('/newJob', ensureAuthenticated, (req,res) => {
  var buildingQuery = Building.find({}).select('name _id');
  buildingQuery.exec(function(err, buildings) {
    res.render('additions/newJob', {buildings});
  });
});

router.post('/newJob', ensureAuthenticated, (req,res) => {
  const {jobName, building} = req.body;
  console.log("Making job with name " + jobName)
  var errors = [];
  var jobNameQuery = Job.find({}).select('name');
  jobNameQuery.exec(function(err,jobs){
    jobs.forEach(function(job) {
      if (job.name == jobName) {
        errors.push({msg: 'A job with this name already exists'});
        console.log('pushing error name exists');
      }
    });
    if (jobName == "") {
      errors.push({msg: 'Please fill in all fields'});
      console.log('pushing error blank field');
    }
    if(errors.length > 0) {
      var buildingQuery = Building.find({}).select('name _id');
      buildingQuery.exec(function(err, buildings) {
        res.render('additions/newJob', {buildings,errors});
      });
    } else {
      creator = req.user._id;
  
      const newJob = new Job({
        'name': jobName,
        'buildingID' : building,
        'employeeID' : creator
      });
  
      newJob.save()
        .then(user => {
          req.flash('success_msg', 'You successfully added a Job!');
          res.redirect('/dashboard');
        })
        .catch(err => console.log(err));
    }
  });
  
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
        console.log('Rendering dashboard with fiterBy: ' + package.filterBy + ' and filterValue: ' + package.filterValue);
        res.render('dashboard',{package:package,allEmployees:employees,buildings:buildings,entries:entries});
      });
    });
  });
});

router.get('/filterPage', ensureAuthenticated, (req,res) => {
  console.log("Called filterPage with GET");
  var readables = [];
  var values = []
  var param = req.query.param;
  if (param == 'creator') {
    User.find({}, function(err,users) {
      users.forEach(function(user){
        readables.push(user.firstName + " " + user.lastName);
        values.push(user._id);
      });
      res.render('filterPage',{readables,values,param});
    });
  } else {
    var query;
    if (param == 'openJob') {
       query = Job.find({complete: false});
    } else if (param =='closedJob') {
      query = Job.find({complete: true}); 
    } else if (param =='job') {
      query = Job.find({});
    }
    query.exec(function(err,jobs) {
      jobs.forEach(function(job) {
        readables.push(job.name);
        values.push(job._id);
      });
      res.render('filterPage',{readables,values,param});
    });
  console.log("Called filterPage with param " + param);
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
  res.render('additions/newClient');
});
router.post('/newClient', (req,res) => {

  const {name} = req.body;
  let errors = [];
  if(name == ""){
    errors.push({msg: 'Please fill in all fields'});
  }
  if(errors.length > 0) {
    res.render('additions/newClient', {
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
    res.render('additions/newEntry',{result:data,firstName:req.user.firstName,lastName:req.user.lastName});
  });
});

router.post('/newEntry', (req,res) => {

  var {regHours,otHours,note,employeeName,datePerformed,job} = req.body;

  let errors = [];
  var date = Date.parse(datePerformed);
  if (isNaN(date) == false) {
    datePerformed = new Date(date);
  } else {
    datePerformed = undefined;
  }

  if (datePerformed == undefined) {
    errors.push({msg: 'Please enter a valid a date format'});
  }
  if (job == undefined) {
    errors.push({msg: "Please select a job"});
  }
  if(errors.length > 0) {
    for (var i=0;i<errors.length;i++){
      req.flash('error_msg', errors[i].msg);
    }
    res.redirect('/dashboard');
  } else {
    creator = mongoose.Types.ObjectId(req.user._id);
    job = mongoose.Types.ObjectId(job)
    const newEntry = new Entry({
      'jobID' : job,
      'employeeID' : creator,
      'datePerformed': datePerformed,
      'regHours' : regHours,
      'otHours' : otHours,
      'note' : note
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
  Client.find({}, function(err, data) {
    res.render('additions/newBuilding',{result:data});
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
    Client.find({}, function(err, data) {
      res.render('additions/newBuilding', {
        result:data,
        errors,
        name,
        address
      });
    });
    
  } else {
    const newBuilding = new Building({
      name,
      address,
      "clientID" : client
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
  RegistrationKey.findOneAndUpdate({key: registrationKey},{$inc:{'numUsed':1}}) //increment by one, the times a registration key is used
  .then(key => {                                                                //this is done to provide insight for security puroposes
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
            const newUser = new User({
              firstName,
              lastName,
              role,
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
