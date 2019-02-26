const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
  //hours, room, buliding, note
  hours: {
    type: Number,
    required: true
  },
  room: {
    type: String,
    required: true
  },
  building: {
    type: String,
    required: true
  },
  note: {
    type: String,
    required: false
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  }
});

const Entry = mongoose.model('Entry', EntrySchema);

module.exports = Entry;
