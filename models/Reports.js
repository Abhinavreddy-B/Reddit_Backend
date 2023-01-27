const mongoose = require('mongoose')

const ReportsSchema = new mongoose.Schema({
    ReportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    ReportedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    Concern: String,
    Post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    SubGreddit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubGreddit'
    },
    ReportedOn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    Ignored: Boolean,
    ReportedAt: Date
})


ReportsSchema.set('toJSON',{
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id
        delete returnedObject._id
        delete returnedObject.__v
    }
})

const Report = mongoose.model('Report',ReportsSchema)

module.exports = Report