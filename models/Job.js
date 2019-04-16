const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    jobName: {
        type: String
    },
    creator: {
        type: String //save the ObjectId of the creator as string
    },
    entries: {
        type: Array //save the relevant entries as an Array of ObjectId's as a string
    },
    complete: {
        type: Boolean
    }
});

const Job = mongoose.model('Job', JobSchema);

module.exports = Job;