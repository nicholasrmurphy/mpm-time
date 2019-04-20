const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
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
  note: {
    type: String,
    required: false
  },
  jobID: { //ObjectID of associated job
    type: mongoose.Schema.Types.ObjectId, ref: 'Job',
    required: true
  },
  employeeID: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User', //ObjectID of employee who create entry
    required: true
  },
});

const Entry = mongoose.model('Entry', EntrySchema);

module.exports = Entry;