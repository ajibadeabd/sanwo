const mongoose = require('mongoose')
const SlackErrorNotificationBot = require('../src/functions/slack-bot')

/**
 * Facilitate connection to database
 * @param {String} url mongodb connection url
 * @return {*} log to show success or failure of connection
 */
exports.connect = function (url) {
  mongoose.connect(url, { useNewUrlParser: true })
    .then(() => {
      console.log('database successfully connected')
    })
    .catch((err) => {
      console.error(`database connection failure: \n ${err.stack}`)
      if (process.env.NOTIFY_SLACK === 'true') {
        new SlackErrorNotificationBot(
          {
            username: 'BackEndBot', type: 'error', webHookUrl: process.env.SLACK_WEB_HOOK_URL
          }
        ).sendMessage(err)
      }
    })
}
