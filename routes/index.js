const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');

//Welcome page
router.get('/', (req,res) => res.render('welcome'));

//dashboard
router.get('/dashboard',ensureAuthenticated, (req,res) =>{
  res.render('dashboard', {
    firstName: req.user.firstName,
    lastName: req.user.lastName
  });
  res.render('newEntry', {
    firstName: req.user.firstName,
    lastName: req.user.lastName
  });
});

module.exports = router;
