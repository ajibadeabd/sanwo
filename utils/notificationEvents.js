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
    this.on('new_order', this.onNewOrderMail)
    this.on('installment_order_approval_mail', this.onInstallmentOrderApprovalMail)
    this.on('order_status_changed', this.onOrderStatusChanged)
    this.on('installment_payment_debit', this.onInstallmentPaymentDebit)
    this.on('installment_payment_completed', this.onInstallmentPaymentCompleted)
    this.on('inventory_created', this.onInventoryCreated)
    this.on('inventory_status_changed', this.onInventoryUpdated)
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
    this.email.send({ template, message: destination, locals })
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

  async onNewOrderMail (order) {
    const buyer = await models.User.findOne({ _id: order.buyer })
      .populate('cooperative')
    const { cart } = order

    this.sendEmail('buyer_new_order_mail', { to: buyer.email }, { cart, order, buyer })

    // Get all sellers which customer purchased item from, send them purchase details
    const sellers = cart.map(item => item.product.seller)
    if (sellers.length) {
      const sentAddress = []
      for (let i = 0; i < sellers.length; i += 1) {
        if (!sentAddress.includes(sellers[i].email)) {
          this.sendEmail('seller_new_order_mail', { to: sellers[i].email }, {
            cart, order, buyer, seller: sellers[i]
          })
          sentAddress.push(sellers[i].email)
        }
      }
    }
  }

  async onInstallmentOrderApprovalMail (installmentOrder) {
    const adminRecords = await models.User.find({ accountType: 'super_admin' })
      .select('_id email')

    const buyer = await models.User.findOne({ _id: installmentOrder.buyer })
      .populate('cooperative')

    const { cart } = installmentOrder
    if (adminRecords.length) {
      for (let i = 0; i < adminRecords.length; i += 1) {
        this.sendEmail('admin_installment_order_approval_mail', { to: adminRecords.email },
          {
            order: installmentOrder, cart, buyer, admin: adminRecords[i]
          })
      }
    }

    this.sendEmail('cooperative_installment_order_approval_mail', { to: buyer.cooperative.email },
      {
        order: installmentOrder, cart, buyer, cooperative: buyer.cooperative
      })
  }

  async onOrderStatusChanged ({ order, status, mandateFormUrl }) {
    this.sendEmail('buyer_order_status_mail', { to: order.buyer.email },
      { order, status, mandateFormUrl })

    // Notify all seller of the item purchased
    const sellers = order.purchases.map(item => item.product.seller)
    if (sellers.length) {
      const sentAddress = []
      for (let i = 0; i < sellers.length; i += 1) {
        // if mail is not already sent to this address
        if (!sentAddress.includes(sellers[i].email)) {
          this.sendEmail('seller_order_status_mail', { to: order.buyer.email },
            { order, status, seller: sellers[i] })
          sentAddress.push(sellers[i].email)
        }
      }
    }
  }

  async onInstallmentPaymentDebit ({ order, payment }) {
    const purchase = order.purchases[0]
    this.sendEmail('buyer_installment_debit_mail', { to: order.buyer.email }, { order, purchase, payment })
    this.sendEmail('seller_installment_debit_mail', { to: purchase.seller.email }, { order, purchase, payment })

    const adminEmails = await models.User.find({ accountType: 'super_admin' })
      .select('-_id email')
    this.sendEmail('admin_installment_debit_mail', { to: adminEmails.join(',') }, { order, purchase, payment })
    const { cooperative } = order.buyer
    this.sendEmail('cooperate_admin_installment_debit_mail', { to: cooperative.email }, { order, purchase, payment })
  }

  async onInstallmentPaymentCompleted ({ order, payment }) {
    const purchase = order.purchases[0]
    this.sendEmail('buyer_installment_completed_mail', { to: order.buyer.email }, { order, purchase, payment })
    this.sendEmail('seller_installment_completed_mail', { to: purchase.seller.email }, { order, purchase, payment })

    const adminEmails = await models.User.find({ accountType: 'super_admin' })
      .select('-_id email')
    this.sendEmail('admin_installment_completed_mail', { to: adminEmails.join(',') }, { order, purchase, payment })
    const { cooperative } = order.buyer
    this.sendEmail('cooperate_admin_installment_completed_mail', { to: cooperative.email }, { order, purchase, payment })
  }

  async onInventoryCreated ({ product, sellerId }) {
    const seller = await models.User.findById(sellerId)
    this.sendEmail('seller_inventory_created', { to: seller.email }, { product, seller })

    const adminEmails = await models.User.find({ accountType: 'super_admin' })
      .select('-_id email')
    this.sendEmail('admin_inventory_created', { to: adminEmails.join(',') }, { product, seller })
  }

  async onInventoryUpdated ({ product }) {
    const seller = await models.User.findById(product.seller)
    this.sendEmail('seller_inventory_updated', { to: seller.email }, { product, seller })

    // const adminEmails = await models.User.find({ accountType: 'super_admin' })
    //   .select('-_id email')
    // this.sendEmail('admin_inventory_created', { to: adminEmails.join(',') }, { product, seller })
  }
}

module.exports = new CoreEvents()
