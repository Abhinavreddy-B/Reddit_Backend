require('dotenv').config()

const Port = process.env.PORT || 5000
const MongoUri = process.env.MONGO_URI
const Secret = process.env.SECRET
const RejectTimeout = process.env.REJECTTIMEOUT || 1000*60*60*24*7
const ReportTimeout = process.env.REPORTTIMEOUT || 1000*60*60*24*10
const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT
const MAIL_USERNAME = process.env.MAIL_USERNAME
const MAIL_PASSWORD = process.env.MAIL_PASSWORD
const OAUTH_CLIENTID = process.env.OAUTH_CLIENTID
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET
const OAUTH_REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN
module.exports = {Port,MongoUri,Secret,RejectTimeout,ReportTimeout,IMAGEKIT_PUBLIC_KEY,IMAGEKIT_PRIVATE_KEY,IMAGEKIT_URL_ENDPOINT,MAIL_USERNAME,MAIL_PASSWORD,OAUTH_CLIENTID,OAUTH_CLIENT_SECRET,OAUTH_REFRESH_TOKEN}