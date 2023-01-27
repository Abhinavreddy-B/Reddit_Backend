const express = require('express')
const Post = require('../models/Posts')
const SubGreddit = require('../models/SubGreddit')
const User = require('../models/user')

const PostsRouter = express.Router()


PostsRouter.post('/:id', async (req, res, next) => {
    const user = req.user
    const id = req.params.id

    // If user is not a participant
    if (!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    let { Text } = req.body
    const relatedSubGreddit = await SubGreddit.findById(id)

    relatedSubGreddit.Banned.forEach(word => {
        let regex = new RegExp(`\\b${word}\\b`,"gi")
        Text = Text.replace(regex,(x) => {return '*'.repeat(x.length)})
    })


    const newPost = new Post({
        Text,
        PostedBy: {
            Name: user.firstName+' '+user.lastName,
            id: user._id
        },
        PostedIn: id,
        Upvotes: 0,
        Downvotes: 0,
        Comments: [],
    })

    try {
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
    } catch (e) {
        console.log(e)
        res.status(404).json({ error: 'Post does not exist' })
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
            post.Upvotes += 1
            await post.save()

            res.status(201).end()
        } catch (e) {
            console.log(e)
            res.status(500).end()
        }
    } catch (e) {
        console.log(e)
        res.status(404).json({ error: 'Post does not exist' })
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
            post.Downvotes += 1
            await post.save()

            res.status(201).end()
        } catch (e) {
            console.log(e)
            res.status(500).end()
        }
    } catch (e) {
        console.log(e)
        res.status(404).json({ error: 'Post does not exist' })
    }
})

PostsRouter.get('/:id/save', async (req, res, next) => {
    let user = req.user
    const Postid = req.params.id

    try {

        let post = await Post.findById(Postid)
        const id = post.PostedIn.toString()

        if (!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')) {
            return res.status(401).json({ error: 'You cant access this' })
        }

        try {
            // console.log(user.Saved)
            // console.log(user.Saved.find(f => console.log(f) || true),Postid)
            if (!user.Saved || !user.Saved.find(f => f.toString() === Postid)) {
                user.Saved = user.Saved ? [...(user.Saved), Postid] : [Postid]
                await user.save()
            }

            res.status(201).end()
        } catch (e) {
            console.log(e)
            res.status(500).end()
        }
    } catch (e) {
        console.log(e)
        res.status(404).json({ error: 'Post does not exist' })
    }
})

PostsRouter.get('/:id/followowner', async (req, res, next) => {
    let user = req.user
    const PostId = req.params.id

    const found = await Post.findById(PostId,{PostedBy: true})

    if(found === null){
        return res.status(400).json({error: 'post does not exist'})
    }
    const FollowingId = found.PostedBy.id
    
    console.log(FollowingId,user._id)
    if(FollowingId.toString() === user._id.toString()){
        return res.status(400).json({error: 'You can not follow yourself'})
    }

    let Following = await User.findById(FollowingId)

    if (Following === null) {
        return res.status(400).json({ error: 'Person does not exist' })
    }


    if (!user.Following.find(f => f.toString() === FollowingId) && !Following.Followers.find(f => f.toString() === user._id.toString())) {

        try {

            user.Following = [...(user.Following), FollowingId]
            user.FollowingCount += 1

            Following.Followers = [...(Following.Followers), user._id]
            Following.FollowerCount += 1
            
            await user.save()
            await Following.save()

            return res.status(201).end()
        }catch(e){
            console.log(e)
            return res.status(500).json({error: 'Failed to Follow'})
        }
    } else {
        return res.status(201).end()
    }
})

module.exports = PostsRouter