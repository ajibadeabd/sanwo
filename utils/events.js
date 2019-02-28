/* eslint-disable require-jsdoc */
const EventEmitter = require('events')
const nodemailer = require('nodemailer')
const path = require('path')
const Email = require('email-templates')
const models = require('../src/models')
const logger = require('../config/logger')
const helper = require('./helpers')

/**
 * @MyEmitter
 */
class CoreEvents extends EventEmitter {
  /**
   *
   */
  constructor () {
    super()
    const nodeMailerConfig = {
      pool: true,
      maxConnections: 10,
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    }
    this.email = new Email({
      message: {
        from: process.env.MAIL_FROM, // sender address
      },
      views: { root: path.resolve('public/templates/emails') },
      send: true,
      transport: nodemailer.createTransport(nodeMailerConfig),
      jsonTransport: true
    })

    // Listen for system events
    this.on('payment_status_changed', this.onPaymentStatusChanged)
  }

  static mailSent (data) {
    logger.log(data)
  }

  static mailFailed (error) {
    logger.error(error)
  }

  /**
   * sendEmail
   * @param {String} template
   * @param {Object} message
   * @param {Object} locals
   * @return {VoidFunction} void
   */
  sendEmail (template, message, locals) {
    this.email.send({ template, message, locals })
      .then(CoreEvents.mailSent).catch(CoreEvents.mailFailed)
  }


  /**
   * onPaymentStatusChanged
   * @onPaymentStatusChanged
   * @param {Object} order
   * @param {String} status
   * @param {Array} adminsEmails
   * @param {Object} buyer
   * @return {Promise<void>} void
   */
  async onPaymentStatusChanged ({ order, buyer }, status) {
    this.sendEmail('buyer_payment_status_mail', { to: buyer.email }, { status, buyer, order })
    let adminEmails = await models.User.find({ accountType: helper.constants.SUPER_ADMIN })
      .select('email -_id')
    adminEmails = adminEmails.map( admin => admin.email)
    this.sendEmail('admin_payment_status_mail', { to: adminEmails.join(',') }, {
      status, buyer, adminEmails, order
    })
  }
}

module.exports = new CoreEvents()
