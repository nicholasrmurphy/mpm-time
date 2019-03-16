const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const Entry = require('../models/Entry');
const Building = require('../models/Building');

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

//Welcome page
router.get('/', (req,res) => res.render('welcome'));

//dashboard
router.get('/dashboard',ensureAuthenticated, (req,res) =>{

  var buildingsData;

  Building.find({}, function(err, data) {
    buildingsData = data;
  });

  Entry.find({}, function(err, data) {
    
    Building.find({}, function(err, data) {
      buildingsData = data;
    });
      res.render('dashboard',{
        result:data,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        buildings: buildingsData
      });
    });
});

module.exports = router;
