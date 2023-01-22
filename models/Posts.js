const { default: mongoose } = require("mongoose");

const PostSchema = new mongoose.Schema({
    Text: String,
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
    Comments: [String],
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