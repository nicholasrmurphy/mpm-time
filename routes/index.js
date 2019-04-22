const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const Entry = require('../models/Entry');
const Building = require('../models/Building');
const User = require('../models/User');
const Job = require('../models/Job');
var mongoose = require('mongoose');

function initPackage(req) {

  var {filterBy,filterValue} = req.body;
  var name = req.user.firstName + " " + req.user.lastName;

  if (filterBy == undefined) {
    filterBy = "none";
  }
  if (filterValue == undefined) {
    filterValue = "none";
  }
  var package = {
    'employeeName': name,
    'role': req.user.role,
    'id': req.user._id,
    'filterBy': filterBy,
    'filterValue': filterValue
  }
  return package;
}

function renderDashboard(query,req,res) {
  console.log("Calling renderDashboard");
  var jobQuery = Job.find({complete: false}).select('name _id');
  query.exec(function(err, entries) {
    records = [];
    if (entries.length > 0) {
      entries.forEach(function(entry){
        var buildingNameQuery = Building.findOne({_id : entry.jobID.buildingID}).select('name');
        buildingNameQuery.exec(function(err, building){
          var record = {
            'employeeName' : entry.employeeID.firstName + " " + entry.employeeID.lastName,
            'buildingName' : building.name,
            'jobName' : entry.jobID.name,
            'complete' : entry.jobID.complete,
            'datePerformed' : entry.datePerformed,
            'regHours' : entry.regHours,
            'otHours' : entry.otHours,
            'totalHours' : (entry.regHours + (entry.otHours * 1.5)),
            'note' : entry.note
          }
          records.push(record);
          if (records.length == entries.length) {
            jobQuery.exec(function(err, jobData) {
              console.log("Rendering");
              var empty = false;
              res.render('dashboard', {empty, records, jobData});
            });
          }
        });
      });
    } else {
      var empty = true;
      jobQuery.exec(function(err, jobData) {
        console.log("Rendering");
        var empty = true;
        res.render('dashboard', {empty, records, jobData});
      });
    }
  });
}
//Welcome page
router.get('/', (req,res) => res.render('welcome'));

//All Records
router.get('/dashboard',ensureAuthenticated, (req,res) =>{ 
  console.log("loading dashboard with GET");
  package = initPackage(req);
  var entryQuery;
  //fetch all entries, but if a journeyman, limit to entries they created
  if (package.role == 'journeyman') { //only show results for this user
    entryQuery = Entry.find({employeeID: package.id}).populate('jobID employeeID');
  } else { //assumes user is admin
    entryQuery = Entry.find({}).populate('jobID employeeID');
    console.log("Moving forward with admin priveleges");
  }
  renderDashboard(entryQuery, req, res);
});

//Filter
router.post('/dashboard', (req,res) => {
  console.log("loading dashboard with POST");
  package = initPackage(req);
  var {filterBy,filterValue} = req.body;
  package.filterBy = filterBy;
  package.filterValue = filterValue;
  if (package.role == 'journeyman') { //only show results for this user
    if ((filterBy == 'job') || (filterBy == 'closedJob') || (filterBy == 'openJob')) {
      filterQuery = Entry.find({employeeID: package.id, jobID: filterValue}).populate('jobID employeeID');
    }
  } else { //assumes user is admin
    if ((filterBy == 'job') || (filterBy == 'closedJob') || (filterBy == 'openJob'))  {
      filterQuery = Entry.find({jobID: filterValue}).populate('jobID employeeID');
    } else if (filterBy == 'creator') {
      filterQuery = Entry.find({employeeID: filterValue}).populate('jobID employeeID');
    }
  }
  renderDashboard(filterQuery, req, res);
});

module.exports = router;
