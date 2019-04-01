const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const Entry = require('../models/Entry');
const Building = require('../models/Building');
const User = require('../models/User');

function getEmployees() {
  var result = [];
  var promise = User.find({}).exec();
  promise.then(function(value){
    value.forEach(function(item){
      object = {
        'firstName':item.firstName,
        'lastName':item.lastName
      }
      result.push(object);

    });
    console.log(result);
    allEmployees = result;
  });
}

function getBuildings() {
  var promise = Building.find({}).exec();
  return promise;
}

function getEntries() {
  var query = Entry.find({}).exec();
  return query;
}

function getPromiseData(promise){
  promise.then(function(value){
    console.log(value);
    return value
  });
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

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

//Welcome page
router.get('/', (req,res) => res.render('welcome'));

//dashboard
router.get('/dashboard',ensureAuthenticated, (req,res) =>{
  package = initPackage(req);
  Building.find({}, function(err, buildings) {
    User.find({}, function(err, employees) {
      Entry.find({}, function(err, entries) {
        res.render('dashboard',{package:package,allEmployees:employees,buildings:buildings,entries:entries});
      });
    });
  });
});

//Filter
router.post('/dashboard', (req,res) => {

  let errors = [];
  package = initPackage(req);
  var {filterBy,filterValue} = req.body;
  package.filterBy = filterBy;
  package.filterValue = filterValue;
  Building.find({}, function(err, buildings) {
    User.find({}, function(err, employees) {
      Entry.find({}, function(err, entries) {
        res.render('dashboard',{package:package,allEmployees:employees,buildings:buildings,entries:entries});
      });
    });
  });
});

module.exports = router;
