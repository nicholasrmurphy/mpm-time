const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
  //hours, room, buliding, note
  datePerformed : {
    type: Date,
    required: true
  },
  regHours: {
    type: Number,
    required: true
  },
  otHours: {
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
  complete: {
    type: Boolean,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  jobName: {
    type: String, //string that points to the ObjectId of the associated job
    required: true
  }
});

const Entry = mongoose.model('Entry', EntrySchema);

module.exports = Entry;
