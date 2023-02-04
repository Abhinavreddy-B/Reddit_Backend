const mongoose = require('mongoose')

const SubGredditSchema = new mongoose.Schema({
    Name: String,
    Description: String,
    Tags: [{
        type: String,
        match: /^[0-9a-z]+$/
    }],
    Banned: [{
        type: String,
        lowercase: true,
    }],
    PeopleCount: Number,
    PostsCount: Number,
    Owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    CreatedAt: Date,
    Posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Posts'
    }],
    People: [{
        ref: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        blocked: Boolean,
    }],
    Requests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    Rejected: [{
        date: Date,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    Reports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    }],
    GrowthStat: [{
        date: {
            type: Date,
            default: new Date(),
        },
        delta: Number
    }],
    PostsVsDateStat: [{
        date: {
            type: Date,
            default: new Date(),
        },
        delta: Number
    }],
    VisitStat: [{
        date: {
            type: Date,
            default: new Date(),
        },
        delta: Number
    }],
    ReportsVsDel: [{
        reported: Number,
        deletedDelta: Number
    }],
    totalReportedCnt: Number,
    totalDeletedCount: Number
})

SubGredditSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id
        delete returnedObject._id
        delete returnedObject.__v
    }
})

const SubGreddit = mongoose.model('SubGreddit', SubGredditSchema)

module.exports = SubGreddit