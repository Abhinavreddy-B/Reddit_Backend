const { default: mongoose } = require("mongoose");

const CommentSchema = new mongoose.Schema({
    Text: {
        type: String,
        required: [true,'comment must contain some text'],
    },
    SubGreddit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubGreddit',
    },
    Post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    Children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
})

CommentSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id
        delete returnedObject._id
        delete returnedObject.__v
    }
})

const Comment = mongoose.model('Comment', CommentSchema)

module.exports = Comment