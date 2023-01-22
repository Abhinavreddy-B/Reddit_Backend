const express = require('express');
const Post = require('../models/Posts');
const SubGreddit = require('../models/SubGreddit')
const User = require('../models/user');
const SubGredditRouter = express.Router()

SubGredditRouter.get('/all', async (req, res, next) => {
    return res.status(200).json(await SubGreddit.find({}))
})

SubGredditRouter.get('/', async (req, res, next) => {
    const user = req.user
    return res.status(200).json(await SubGreddit.find({ Owner: user._id }))
})

SubGredditRouter.post('/', async (req, res, next) => {
    const { Name, Description, Tags, Banned } = req.body
    const user = req.user

    const newSubGreddit = new SubGreddit({
        Name,
        Description,
        Tags,
        Banned,
        PeopleCount: 1,
        PostsCount: 0,
        Owner: user._id,
        CreatedAt: new Date()
    })

    try {

        const response = await newSubGreddit.save()

        user.SubGreddits.push({id: response._id,role: 'mod'})

        await user.save()

        res.status(200).json(response)
    } catch (e) {
        console.log(e)
        return res.status(500).end()
    }
    
})

SubGredditRouter.delete('/:id', async (req, res, next) => {
    let user = req.user
    const id = req.params.id
    try {
        console.log("deleteing",req.params.id)
        const found = await SubGreddit.findById(id)
        // console.log(found.Owner.toString())
        if (found.Owner.toString() !== user._id.toString()) {
            return res.status(401).json({ error: 'You are not allowed to delete this' })
        }
        
        console.log("old",user.SubGreddits)
        user.SubGreddits = user.SubGreddits.filter(f => f.id.toString() !== id)
        
        console.log("new",user.SubGreddits)
        console.log("deleting",await SubGreddit.findById(id))

        await user.save()
        await SubGreddit.findByIdAndDelete(id)

        res.status(204).end()

    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: 'Malformed Id' })
    }
})

SubGredditRouter.delete('/leave/:id', async (req,res,next) => {
    const user = req.user
    const id =  req.params.id
    
    if(!user.SubGreddits.find(f => f.id.toString() === id)){
        return res.status(400).json({error: 'You are not In the SubGreddit'})
    }else if(user.SubGreddits.find(f => f.id.toString() === id).role === 'mod'){
        return res.status(400).json({erro: 'You Are a Moderator. You cant leave'})
    }
    user.SubGreddits = user.SubGreddits.map(f => f.id.toString() !== id ? f : {...f,role: 'left'})
    await user.save()
    return res.status(200).end()
})

SubGredditRouter.get('/:id',async (req,res,next) => {
    const user = req.user
    const id = req.params.id

    // If user is not a participant
    if(!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')){
        return res.status(401).json({error: 'You cant access this'})
    }
    
    const found = await SubGreddit.findById(id).populate({
        path: 'Posts',
        model: Post,
    })
    res.status(200).json(found)
})

module.exports = SubGredditRouter