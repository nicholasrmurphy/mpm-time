const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const Entry = require('../models/Entry');
const Building = require('../models/Building');
const User = require('../models/User');
const Job = require('../models/Job');

function initPackage(req) {

  var {filterBy,filterValue} = req.body;
  var name = ""
  name += req.user.firstName;
  name += " ";
  name += req.user.lastName;

  var package = {
    'employeeName': name,
    'privilege': req.user.privilege,
    'id': req.user._id
  }

  if (filterBy == undefined) {
    filterBy = 'none';
    filterValue = 'none';
  }
  if (filterValue == undefined) {
    filterBy = 'none';
    filterValue = 'none';
  }
  package.filterBy = filterBy;
  package.filterValue = filterValue;
  console.log("Set name to " + package.employeeName);
  console.log("filterBy: " + package.filterBy);
  console.log("filterValue: " + package.filterValue);
  return package;

}

//Welcome page
router.get('/', (req,res) => res.render('welcome'));

router.get('/dashboard',ensureAuthenticated, (req,res) =>{ 
  console.log("loading dashboard with GET");
  package = initPackage(req);
  var {filterBy,filterValue} = req.body;
  package.filterBy = filterBy;
  package.filterValue = filterValue;
  var buildingQuery = Building.find({}).select('name _id');
  var jobQuery = Job.find({}).select('jobName _id');
  var entryQuery;
  //set entry query based on filters
  if (package.privilege == 'user') { //only show results for this user
    entryQuery = Entry.find({creator: package.id});
  } else { //assumes user is admin
    entryQuery = Entry.find({});
  }

  buildingQuery.exec(function(err, buildings) {
    jobQuery.exec( function(err, jobs) {
      entryQuery.exec( function(err, entries) {
        res.render('dashboard',{package:package,buildings:buildings,entries:entries,jobs:jobs});
      });
    });
  });
});

//Filter
router.post('/dashboard', (req,res) => {
  console.log("loading dashboard with POST");
  package = initPackage(req);
  var {filterBy,filterValue} = req.body;
  package.filterBy = filterBy;
  package.filterValue = filterValue;
  var buildingQuery = Building.find({}).select('name _id');
  var jobQuery = Job.find({}).select('jobName _id');
  var entryQuery;
  //set entry query based on filters
  if (package.privilege == 'user') { //only show results for this user
    if (package.filterBy == 'room') {
      entryQuery = Entry.find({room: filterValue, creator: package.id});
    } else if (package.filterBy == "job") {
      entryQuery = Entry.find({jobName: filterValue, creator: package.id});
    } else { //no filter
      entryQuery = Entry.find({creator: package.id});
    }
  } else { //assumes user is admin
    if (package.filterBy == 'creator') {
      entryQuery = Entry.find({creator: filterValue});
    } else if (package.filterBy == 'room') {
      entryQuery = Entry.find({room: filterValue});
    } else if (package.filterBy == 'job') {
      entryQuery = Entry.find({jobName: filterValue});
    }else { //no filter
      entryQuery = Entry.find({});
    }
  }

  buildingQuery.exec(function(err, buildings) {
    jobQuery.exec( function(err, jobs) {
      entryQuery.exec( function(err, entries) {
        res.render('dashboard',{package:package,buildings:buildings,entries:entries,jobs:jobs});
      });
    });
  });
});

module.exports = router;
