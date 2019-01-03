const express = require('express')
const path = require('path')
const morgan = require('morgan')
const io = require('socket.io')
const IoEvents = require('./src/controllers/messageController')
const SlackErrorNotificationBot = require('./src/functions/slack-bot')

const db = require('./utils/db')
const config = require('./config/index.js')

const route = require('./src/routes')
const logger = require('./config/logger')

// Models
const Models = require('./src/models')

const app = express()

// Parse the payload and add to request.body
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Setup morgan dev
app.use(morgan('dev'))

// Attach all the database models to here
app.use((req, res, next) => {
  req.Models = Models
  req.log = logger.log
  next()
})

// All route should be added to the index.js file inside the route folder
app.use('/', route)

// Handle the error
app.use((err, req, res, next) => {
  logger.error(err)
  if (process.env.NOTIFY_SLACK) {
    new SlackErrorNotificationBot(
      {
        username: 'BackEndBot', type: 'error', webHookUrl: process.env.SLACK_WEB_HOOK_URL, channel: '#paysmosmo'
      }
    ).sendMessage(err)
  }
})

db.connect(config.dbUrl)

const server = app.listen(config.port)
//  Start socketIo
new IoEvents(io(server)).startSocket()

logger.log(`Listening @ port ${config.port}`)
