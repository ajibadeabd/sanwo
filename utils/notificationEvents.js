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
    this.on('wallet_status_changed', this.onWalletStatusChanged)
    this.on('purchase_status_changed', this.onPurchaseStatusChanged)
    this.on('tracking_details_added', this.onTrackingDetailsAdded)
    this.on('completed_order_mail', this.onCompletedOrderMail)
  }

  static mailSent (data) {
    logger.log('Mail Sent')
  }

  static mailFailed (error) {
    logger.error('Error Sending Email')
  }

  /**
   * sendEmail
   * @param {String} template
   * @param {Object} destination
   * @param {Object} locals
   * @return {VoidFunction} void
   */
  sendEmail (template, destination, locals) {
    this.email.send({ template, destination, locals })
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
  async onPaymentStatusChanged ({ order, buyer, sellerEmails }, status) {
    // Notify the buyer
    this.sendEmail('buyer_payment_status_mail', { to: buyer.email }, { status, buyer, order })
    let adminEmails = await models.User.find({ accountType: helper.constants.SUPER_ADMIN })
      .select('email -_id')

    // Notify all admin
    adminEmails = adminEmails.map(admin => admin.email)
    this.sendEmail('admin_payment_status_mail', { to: adminEmails.join(',') }, {
      status, buyer, adminEmails, order
    })

    this.sendEmail('seller_payment_status_mail', { to: sellerEmails.join(',') }, {
      status, buyer, adminEmails, order
    })
  }

  async onWalletStatusChanged ({ wallet }, status) {
    const { purchase, seller } = wallet
    this.sendEmail('seller_wallet_status_mail', { to: seller.email }, { seller, purchase, status })

    let adminEmails = await models.User.find({ accountType: helper.constants.SUPER_ADMIN })
      .select('email -_id')

    // Notify all admin
    adminEmails = adminEmails.map(admin => admin.email)
    this.sendEmail('admin_wallet_status_mail', { to: adminEmails.join(',') }, { seller, purchase, status })
  }

  async onPurchaseStatusChanged ({ order, status, purchase }) {
    this.sendEmail('buyer_purchase_status_mail', { to: order.buyer.email }, { order, status, purchase })
    this.sendEmail('seller_purchase_status_mail', { to: purchase.seller.email }, { order, status, purchase })
  }

  async onTrackingDetailsAdded ({ order, trackingDetails }) {
    this.sendEmail('buyer_purchase_status_mail', { to: order.buyer.email }, { order, trackingDetails })
  }

  async onCompletedOrderMail ({ order, status, purchase }) {
    this.sendEmail('completed_order_mail', { to: order.buyer.email }, { order, status, purchase })
  }
}

module.exports = new CoreEvents()
