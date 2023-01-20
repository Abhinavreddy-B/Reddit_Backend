const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    userName: String,
    Email: String,
    Age: Number,
    ContactNumber: Number,
    passwordHash: String
})

UserSchema.set('toJSON', {
    transform: (document,returnedObject) => {
        returnedObject._id = returnedObject.id
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash
    }
})

const User = mongoose.model('User',UserSchema)

module.exports = User