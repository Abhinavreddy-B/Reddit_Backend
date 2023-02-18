const { default: mongoose } = require("mongoose");

const PostSchema = new mongoose.Schema({
    Text: {
        type: String,
        required: [true,'any Post requiresa some text']
    },
    PostedBy: {
        Name: String,
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    PostedIn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubGreddit'
    },
    Upvotes: Number,
    Downvotes: Number,
    UpvoteList: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    DownvoteList: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    Comments: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }],
        default: []
    },
})

PostSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id
        delete returnedObject._id
        delete returnedObject.__v
    }
})

const Post = mongoose.model('Post', PostSchema)

module.exports = Post