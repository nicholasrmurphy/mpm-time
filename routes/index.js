const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');

//Welcome page
router.get('/', (req,res) => res.render('welcome'));

//dashboard
router.get('/dashboard',ensureAuthenticated, (req,res) =>
res.render('dashboard', {
  firstName: req.user.firstName
}));

module.exports = router;
