const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    userName: String,
    Email: String,
    Age: Number,
    ContactNumber: Number,
    passwordHash: String,
    FollowerCount: Number,
    FollowingCount: Number,
    Followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    Following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
})

UserSchema.set('toJSON', {
    transform: (document,returnedObject) => {
        returnedObject.id = returnedObject._id
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash
    }
})

const User = mongoose.model('User',UserSchema)

module.exports = User