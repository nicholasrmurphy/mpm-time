const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    complete: {
        type: Boolean,
        default: false
    },
    buildingID: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Building', //save the ObjectId of the associated Building
        required: true
    },
    employeeID: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', //save the ObjectId of the creator as string
        required: true
    }
});

const Job = mongoose.model('Job', JobSchema);

module.exports = Job;