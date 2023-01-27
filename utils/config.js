require('dotenv').config()

const Port = process.env.PORT || 5000
const MongoUri = process.env.MONGO_URI
const Secret = process.env.SECRET
const RejectTimeout = process.env.REJECTTIMEOUT || 1000*60*60*24*7
const ReportTimeout = process.env.REPORTTIMEOUT || 1000*60*60*24*10
module.exports = {Port,MongoUri,Secret,RejectTimeout,ReportTimeout}