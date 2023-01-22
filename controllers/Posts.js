const express = require('express')
const Post = require('../models/Posts')
const SubGreddit = require('../models/SubGreddit')

const PostsRouter = express.Router()


PostsRouter.post('/:id', async (req, res, next) => {
    const user = req.user
    const id = req.params.id

    // If user is not a participant
    if (!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    const { Text } = req.body

    const newPost = new Post({
        Text,
        PostedBy: {
            Name: user.Name,
            id: user._id
        },
        PostedIn: id,
        Upvotes: 0,
        Downvotes: 0,
        Comments: [],
    })
    try {
        const relatedSubGreddit = await SubGreddit.findById(id)
        const saved = await newPost.save()

        relatedSubGreddit.Posts.push(saved._id)
        relatedSubGreddit.PostsCount += 1
        await relatedSubGreddit.save()

        return res.status(201).json(saved)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ error: 'Some Internal Error' })
    }
})

PostsRouter.post('/comment/:id', async (req, res, next) => {
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
            post.Comments.push(comment)
            await post.save()

            res.status(201).json(comment)
        } catch (e) {
            console.log(e)
            res.status(500).end()
        }
    }catch(e){
        console.log(e)
        res.status(404).json({error: 'Post does not exist'})
    }
})

PostsRouter.get('/:id/upvote', async (req, res, next) => {
    const user = req.user
    const Postid = req.params.id

    try {

        let post = await Post.findById(Postid)
        const id = post.PostedIn.toString()

        if (!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')) {
            return res.status(401).json({ error: 'You cant access this' })
        }

        try {
            post.Upvotes+=1
            await post.save()

            res.status(201).end()
        } catch (e) {
            console.log(e)
            res.status(500).end()
        }
    }catch(e){
        console.log(e)
        res.status(404).json({error: 'Post does not exist'})
    }
})

PostsRouter.get('/:id/downvote', async (req, res, next) => {
    const user = req.user
    const Postid = req.params.id

    try {

        let post = await Post.findById(Postid)
        const id = post.PostedIn.toString()

        if (!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')) {
            return res.status(401).json({ error: 'You cant access this' })
        }

        try {
            post.Downvotes+=1
            await post.save()

            res.status(201).end()
        } catch (e) {
            console.log(e)
            res.status(500).end()
        }
    }catch(e){
        console.log(e)
        res.status(404).json({error: 'Post does not exist'})
    }
})

module.exports = PostsRouter