const mongoose = require('mongoose');

const RegistrationKeySchema = new mongoose.Schema({
  key: {
    type: String
  },
  intendedUser: {
    type: String
  },
  note: {
    type: String
  },
  numUsed: {
    type: Number
  },
  role: {
    type: String
  },
  privilege : {
    type: String
  }
});

const RegistrationKey = mongoose.model('RegistrationKey', RegistrationKeySchema);

module.exports = RegistrationKey;
