const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const Entry = require('../models/Entry');
const Building = require('../models/Building');
const User = require('../models/User');
const Job = require('../models/Job');

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
    console.log("User privelage: user");
    filterBy = 'Employee';
    filterValue = req.user.firstName + ' ' + req.user.lastName;
  }
  package.filterBy = filterBy;
  package.filterValue = filterValue;
  return package;

}

//Welcome page
router.get('/', (req,res) => res.render('welcome'));

//dashboard
router.get('/dashboard',ensureAuthenticated, (req,res) =>{
  console.log("loading dahboard with GET");
  package = initPackage(req);
  Building.find({}, function(err, buildings) {
    User.find({}, function(err, employees) {
      Entry.find({}, function(err, entries) {
        Job.find({}, function(err, jobs) {
          res.render('dashboard',{package:package,allEmployees:employees,buildings:buildings,entries:entries,jobs:jobs});
        });
      });
    });
  });
});

//Filter
router.post('/dashboard', (req,res) => {
  console.log("loading dashboard with POST");
  let errors = [];
  package = initPackage(req);
  var {filterBy,filterValue} = req.body;
  package.filterBy = filterBy;
  package.filterValue = filterValue;
  console.log("Set filterBy to " + package.filterBy);
  console.log("Set filterValue to " + package.filterValue);
  Building.find({}, function(err, buildings) {
    User.find({}, function(err, employees) {
      Entry.find({}, function(err, entries) {
        Job.find({}, function(err, jobs) {
          res.render('dashboard',{package:package,allEmployees:employees,buildings:buildings,entries:entries,jobs:jobs});
        });      
      });
    });
  });
});

module.exports = router;
