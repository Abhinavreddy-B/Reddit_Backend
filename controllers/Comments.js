const express = require('express')
const Comment = require('../models/Comments')
const Post = require('../models/Posts')

const CommentRouter  = express.Router()

CommentRouter.post('/post/:id',async (req,res) => {
    const user = req.user
    const Postid = req.params.id
    const { comment } = req.body
    try {

        let post = await Post.findById(Postid)
        const id = post.PostedIn.toString()

        if (!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')) {
            return res.status(401).json({ error: 'You cant access this' })
        }

        try {
            const newcomment = new Comment({
                Text: comment,
                SubGreddit: post.PostedIn,
                Post: post._id,
                Children: []
            })
            const savedComment  = await newcomment.save()
            post.Comments.push(savedComment._id)
            await post.save()

            res.status(201).json({Text: savedComment.Text,id: savedComment._id.toString()})
        } catch (e) {
            console.log(e)
            res.status(500).end()
        }
    } catch (e) {
        console.log(e)
        res.status(404).json({ error: 'Post does not exist' })
    }
})

CommentRouter.post('/:id/comment',async (req,res) => {
    const user = req.user
    const CommentId = req.params.id
    const { commentReply } = req.body
    try {

        let comment = await Comment.findById(CommentId)
        const id = comment.SubGreddit.toString()

        if (!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')) {
            return res.status(401).json({ error: 'You cant access this' })
        }

        try {
            const newcomment = new Comment({
                Text: commentReply,
                SubGreddit: comment.SubGreddit,
                Post: comment.Post,
                Children: []
            })
            const savedComment  = await newcomment.save()
            comment.Children.push(savedComment._id)
            await comment.save()

            res.status(201).json({Text: savedComment.Text,id: savedComment._id.toString()})
        } catch (e) {
            console.log(e)
            res.status(500).end()
        }
    } catch (e) {
        console.log(e)
        res.status(404).json({ error: 'Comment does not exist' })
    }
})

CommentRouter.get('/:id',async (req,res) => {
    const user = req.user
    const CommentId = req.params.id
    try{
        let comment = await Comment.findById(CommentId).populate({
            path: 'Children',
            model: Comment,
            select: {Text: true}
        })
        const id = comment.SubGreddit.toString()

        if (!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')) {
            return res.status(401).json({ error: 'You cant access this' })
        }

        
        return res.status(200).json(comment.Children)
    }catch(e){
        console.log(e)
        return res.status(400).json({error: e})
    }
})
module.exports = CommentRouter