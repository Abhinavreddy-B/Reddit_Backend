const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true,'firstName is Required field'],
    },
    lastName: {
        type: String,
        required: [true,'lastName is Required field'],
    },
    userName: {
        type: String,
        required: [true,'userName is Required field'],
        unique: [true,'Username Already Exists']
    },
    Email: {
        type: String,
        unique: [true,'Email already exists'],
        required: [true,'Email is Required field'],
    },
    Age: {
        type: Number,
        required: [true,'Age is Required field'],
        min: [1, 'Age Must Be between 1 and 100'],
        max: [100, 'Age Must Be between 1 and 100']
    },
    ContactNumber: {
        type: Number,
        required: [true,'Contact Number is Required field'],
        validate: {
            validator: function(v) {
                var re = /^[0-9]{10}$/;
                return re.test(v.toString())
            },
            message: 'Provided phone number is invalid.'
        }
    },
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
    }],
    SubGreddits: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubGreddit'
        },
        role: String
    }],
    Saved: [{
        SubGreddit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubGreddit'
        },
        Post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }
    }],
    Reports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    }]
})

UserSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash
    }
})

const User = mongoose.model('User', UserSchema)

module.exports = User