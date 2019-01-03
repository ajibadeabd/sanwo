/**
 * Created by PhpStorm.
 * User: Balogun Wahab
 * Date: 1/3/19
 * Time: 10:25 AM
 */

const request = require('request')

const SlackErrorNotificationBot = function (config) {
  if (!config.username || !config.type || !config.webHookUrl) {
    throw new Error(`SlackErrorNotificationBot: Invalid config property. 
    webHookUrl, username and type are required`)
  }
  /**
   * messagePayload sample
   * {
   *   message: 'titleOfTheMessage',
   *   stack: 'contentOfTheMessage',
   * }
   *
   * config sample
   * {
   *   username: 'botDisplayName',
   *   type: 'warning|error|info',
   *   channel: 'overrideChannel e.g #general',
   * }
   */
  this.config = config
  this.types = {
    error: '#D00000',
    warning: '#ffe936',
    info: '#565aff',
  }
}

SlackErrorNotificationBot.prototype.callSlack = function (payload, callback) {
  request.post(this.config.webHookUrl,
    callback).form(payload)
}

SlackErrorNotificationBot.prototype.sendMessage = function (messagePayload) {
  const pretext = 'May day!! May day!!! Alpha, Tango, Zulu do you read me. We have gat a situation :worried:'
  const payload = {
    username: this.config.username,
    icon_emoji: ':globe_with_meridians:',
    attachments: [
      {
        pretext,
        color: this.types[this.config.type],
        fields: [
          {
            title: messagePayload.message,
            value: messagePayload.stack,
            short: false
          }
        ]
      }
    ]
  }
  if (this.config.channel) payload.channel = this.config.channel
  this.callSlack({ payload: JSON.stringify(payload) },
    (responseError, httpResponse) => ((responseError)
      ? Promise.reject(new Error('HTTP Connection error'))
      : Promise.resolve(httpResponse)))
}

module.exports = SlackErrorNotificationBot
