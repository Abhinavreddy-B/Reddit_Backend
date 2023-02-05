require('dotenv').config()

const Port = process.env.PORT || 5000
const MongoUri = process.env.MONGO_URI
const Secret = process.env.SECRET
const RejectTimeout = process.env.REJECTTIMEOUT || 1000*60*60*24*7
const ReportTimeout = process.env.REPORTTIMEOUT || 1000*60*60*24*10
const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT
module.exports = {Port,MongoUri,Secret,RejectTimeout,ReportTimeout,IMAGEKIT_PUBLIC_KEY,IMAGEKIT_PRIVATE_KEY,IMAGEKIT_URL_ENDPOINT}