const express = require('express')
const Post = require('../models/Posts')
const Report = require('../models/Reports')
const SubGreddit = require('../models/SubGreddit')
const User = require('../models/user')
const config = require('../utils/config')
const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    secure: false,
    auth: {
        user: config.MAIL_USERNAME,
        pass: config.MAIL_PASSWORD,
    }
});

const SendMail = async (to,content,subject) => {
    let mailOptions = {
        from: config.MAIL_USERNAME,
        to: to,
        subject: subject,
        text: content
    };

    transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
            console.log("Error " + err);
        } else {
            console.log("Email sent successfully");
        }
    });
}

const ReportsRouter = express.Router()

ReportsRouter.post('/', async (req, res, next) => {
    const user = req.user

    const { Concern, PostId } = req.body

    const found = await Post.findById(PostId).populate('PostedIn', { _id: true, Name: true, Owner: true })
    const SubGredditId = found.PostedIn._id.toString()

    if (!user.SubGreddits.find(s => s.id.toString() === SubGredditId && (s.role === 'mod' || s.role === 'joined'))) {
        return res.status(401).json({ error: 'You do not belong to the corresponding subgreddit' })
    }
    
    if(found.PostedBy.id.toString() === found.PostedIn.Owner.toString()){
        return res.status(400).json({ error: 'You cannot report on the Moderator' })
    }

    if(found.PostedBy.id.toString() === user._id.toString()){
        return res.status(400).json({ error: 'You cannot report on the Yourself' })
    }

    const previous = await Report.find({ ReportedBy: user._id, Post: found._id })

    if (previous.length >= 1) {
        return res.status(400).json({ error: 'you have already reported this post!' })
    }

    newReport = new Report({
        ReportedBy: user._id,
        ReportedTo: found.PostedIn.Owner,
        Concern,
        Post: found._id,
        ReportedOn: found.PostedBy.id,
        ReportedAt: new Date(),
        SubGreddit: SubGredditId
    })

    // console.log(newReport)
    // const owner = await User.findById(found.PostedIn.Owner)
    try {

        const saved = await newReport.save()

        const In = await SubGreddit.findById(found.PostedIn)
        In.Reports = In.Reports ? [...In.Reports, saved._id] : [saved._id]
        In.totalReportedCnt = In.totalReportedCnt + 1
        In.ReportsVsDel.push({ reported: In.totalReportedCnt, deletedDelta: 0 })
        await In.save()

        res.status(201).end()
    } catch (e) {
        console.log(e)
        next(e)
    }
})

ReportsRouter.get('/:id/ignore', async (req, res, next) => {
    const user = req.user

    const reportId = req.params.id
    const report = await Report.findById(reportId).populate([{
        path: 'Post',
        model: 'Post',
        select: { _id: true, PostedIn: true }
    },{
        path: 'ReportedOn',
        model: 'User',
        select: {Email: true}
    }])

    if (report === null) {
        return res.status(400).json({ error: 'report does not exist' })
    }
    const SubGredditId = report.Post.PostedIn.toString()

    if (!user.SubGreddits.find(f => f.id.toString() === SubGredditId && f.role === 'mod')) {
        return res.status(401).json({ error: 'You are not allowed to do this' })
    }

    // const foundSubGreddit = await SubGreddit.findById(SubGredditId)

    // foundSubGreddit.Reports = foundSubGreddit.Reports.filter(f => f.toString() !== reportId)

    // Report.findByIdAndDelete(reportId)
    report.Ignored = true

    await report.save()

    SendMail(report.ReportedOn.Email,'A Report on you was Ignored','Report in Greddit')
    return res.status(200).end()
})

ReportsRouter.get('/:id/block', async (req, res, next) => {
    const user = req.user

    const reportId = req.params.id
    const report = await Report.findById(reportId).populate([{
        path: 'Post',
        model: 'Post',
        select: { _id: true, PostedIn: true }
    },{
        path: 'ReportedOn',
        model: 'User',
        select: {Email: true}
    },{
        path: 'ReportedBy',
        model: 'User',
        select: {Email: true}
    }])

    if (report === null) {
        return res.status(400).json({ error: 'report does not exist' })
    }
    if (report.Ignored === true) {
        return res.status(400).json({ error: 'You cant do this action since you ignored the report' })
    }
    const SubGredditId = report.Post.PostedIn.toString()

    if (!user.SubGreddits.find(f => f.id.toString() === SubGredditId && f.role === 'mod')) {
        return res.status(401).json({ error: 'You are not allowed to do this' })
    }

    const post = await Post.findById(report.Post._id)

    // post.PostedBy.Name = 'Blocked User'
    const foundSubGreddit = await SubGreddit.findById(SubGredditId)

    // foundSubGreddit.Reports = foundSubGreddit.Reports.filter(f => f.toString() !== reportId)

    // foundSubGreddit.Post 
    // Report.findByIdAndDelete(reportId)

    // await post.save()
    // console.log("Hi",foundSubGreddit)
    foundSubGreddit.People = foundSubGreddit.People.map(f => f.ref.toString() === post.PostedBy.id.toString() ? { ...f, blocked: true } : f)

    // console.log("Here",foundSubGreddit)
    await Post.updateMany({ PostedBy: { Name: post.PostedBy.Name, id: post.PostedBy.id }, PostedIn: SubGredditId }, { PostedBy: { Name: 'Blocked User', id: post.PostedBy.id } })
    await User.findByIdAndUpdate(report.ReportedOn,{$pull: {SubGreddits: {id: foundSubGreddit._id}}})
    await foundSubGreddit.save()

    SendMail(report.ReportedOn.Email,'You were Blocked','Report in Greddit')
    SendMail(report.ReportedBy.Email,'Considering your report, the corresponding user was blocked','Report in Greddit')
    return res.status(200).end()
})

ReportsRouter.get('/:id/delete', async (req, res, next) => {
    const user = req.user

    const reportId = req.params.id
    const report = await Report.findById(reportId).populate([{
        path: 'Post',
        model: 'Post',
        select: { _id: true, PostedIn: true }
    },{
        path: 'ReportedOn',
        model: 'User',
        select: {Email: true}
    },{
        path: 'ReportedBy',
        model: 'User',
        select: {Email: true}
    }])

    if (report === null) {
        return res.status(400).json({ error: 'report does not exist' })
    }
    if (report.Ignored === true) {
        return res.status(400).json({ error: 'You cant do this action since you ignored the report' })
    }
    const SubGredditId = report.Post.PostedIn.toString()

    if (!user.SubGreddits.find(f => f.id.toString() === SubGredditId && f.role === 'mod')) {
        return res.status(401).json({ error: 'You are not allowed to do this' })
    }

    const post = await Post.findById(report.Post._id)

    const foundSubGreddit = await SubGreddit.findById(SubGredditId)


    foundSubGreddit.Posts = foundSubGreddit.Posts.filter(f => f.toString() !== post._id.toString())
    // foundSubGreddit.Reports = foundSubGreddit.Reports.filter(f => f.toString() !== reportId)
    foundSubGreddit.PostsCount = foundSubGreddit.Posts.length
    foundSubGreddit.ReportsVsDel.push({
        reported: foundSubGreddit.totalReportedCnt,
        deletedDelta: 1
    })
    // Report.findByIdAndDelete(reportId)

    await foundSubGreddit.save()
    await Post.findByIdAndDelete(post._id)
    await User.updateMany({ Saved: { $elemMatch: { Post: post._id } } }, { $pull: { Saved: { Post: post._id } } })
    await Report.deleteMany({ Post: post._id })

    SendMail(report.ReportedOn.Email,'Your Post was deleted','Report in Greddit')
    SendMail(report.ReportedBy.Email,'Considering your report, the corresponding post was deleted','Report in Greddit')
    return res.status(200).end()
})

module.exports = ReportsRouter