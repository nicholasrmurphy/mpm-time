const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  }
});

const Building = mongoose.model('Building', BuildingSchema);

module.exports = Buliding;
