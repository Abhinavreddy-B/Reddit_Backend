const express = require('express')
const SubGreddit = require('../models/SubGreddit')

const SubGredditRouter = express.Router()

SubGredditRouter.get('/all',async (req,res,next) => {
    return res.status(200).json(await SubGreddit.find({}))
})

SubGredditRouter.get('/',async (req,res,next) => {
    const user = req.user
    return res.status(200).json(await SubGreddits.find({Owner: user._id}))
})

SubGredditRouter.post('/',async (req,res,next) => {
    const {Name,Description,Tags,Banned} = req.body
    const user = req.user

    const newSubGreddit = new SubGreddit({
        Name,
        Description,
        Tags,
        Banned,
        PeopleCount: 1,
        PostsCount: 0,
        Owner: user._id
    })
    
    try{

        const response = await newSubGreddit.save()
        
        user.SubGreddits.push(response._id)
        
        await user.save()
        return res.status(200).json(response)
    }catch(e){
        console.log(e)
        res.status(500).end()
    }
})

SubGredditRouter.delete('/:id',async (req,res,next) => {
    let user =req.user
    const id = req.params.id
    try{
        const found = await SubGreddit.findById(id)
        console.log(found.Owner.toString())
        if(found.Owner.toString() !== user._id.toString()){
            return res.status(401).json({error: 'You are not allowed to delete this'})
        }

        user.SubGreddits = user.SubGreddits.filter(f => f.toString() !== id)

        await user.save()
        await SubGreddit.findOneAndDelete(found)

        res.status(204).end()

    }catch(e){
        console.log(e)
        return res.status(400).json({error: 'Malformed Id'})
    }
})
module.exports = SubGredditRouter