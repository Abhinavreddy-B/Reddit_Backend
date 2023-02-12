const { default: mongoose } = require("mongoose");

const ChatSchema = new mongoose.Schema({
    mesg: {
        type: String,
        required: [true,'any Post requiresa some text']
    },
    By: String,
    time: Date,
    Room: String,
})

ChatSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id
        delete returnedObject._id
        delete returnedObject.__v
    }
})

const Chat = mongoose.model('Chat', ChatSchema)

module.exports = Chat