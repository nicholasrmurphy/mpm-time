const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  clientID: { //ObjectID of associated client
    type: mongoose.Schema.Types.ObjectId, ref: 'Client',
    required: true
  }
});

const Building = mongoose.model('Building', BuildingSchema);

module.exports = Building;
