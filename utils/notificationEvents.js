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
      views: { root: path.resolve('mail_templates/') },
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
    this.on('registered_new_buyer', this.onRegisteredNewBuyer)
    this.on('cooperative_member_status_updated', this.onCooperativeMemberStatusUpdated)
    this.on('send_password_reset_email', this.onSendPasswordResetEmail)
    this.on('installment_cart_approval_mail', this.onInstallmentCartApprovalMail)
    this.on('seller_installment_cart_declined', this.onSellerInstallmentCartDeclined)
    this.on('installment_cart_approval_request_admin', this.onInstallmentCartApprovalRequestAdmin)
    this.on('installment_cart_admin_approved', this.onInstallmentCartAdminApproved)
    this.on('installment_cart_admin_declined', this.onInstallmentCartAdminDeclined)
    this.on('buyer_mandate_form_details', this.onBuyerMandateFormDetails)
  }

  static mailSent (data) {
    logger.log('Mail Sent')
  }

  static mailFailed (error) {
    console.log(error)
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
   * @description Converts arrays of email object to string
   * @param {Array} emailArrayObject
   * @return {Socket|*|string} string
   */
  static convertEmailsToString (emailArrayObject) {
    return emailArrayObject.map(obj => obj.email).join(',')
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
    this.sendEmail('admin_payment_status_mail', { to: `${CoreEvents.convertEmailsToString(adminEmails)}` }, {
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
    this.sendEmail('admin_wallet_status_mail', { to: `${CoreEvents.convertEmailsToString(adminEmails)}` }, { seller, purchase, status })
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
        this.sendEmail('admin_installment_order_approval_mail', { to: adminRecords[i].email },
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

  async onInstallmentCartApprovalMail ({ cart, approvalRecord }) {
    const adminEmails = await models.User.find({ accountType: 'super_admin' })
      .select('-_id email')

    // de-structure the cart object to get the user details
    const {
      product, user: buyer, user: { cooperative }, product: { seller }
    } = cart

    // Send seller and approval email
    this.sendEmail('seller_cart_item_confirmation_mail', { to: seller.email },
      {
        cart, seller, product, buyer, approvalRecord
      })

    // send notification email to all admin and the user cooperative admin
    if (adminEmails.length) {
      this.sendEmail('admin_cart_item_confirmation_mail',
        { to: `${CoreEvents.convertEmailsToString(adminEmails)}, ${cooperative.email}` },
        {
          cart, seller, product, buyer, approvalRecord
        })
    }
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
    this.sendEmail('admin_installment_debit_mail', { to: `${CoreEvents.convertEmailsToString(adminEmails)}` }, { order, purchase, payment })
    const { cooperative } = order.buyer
    this.sendEmail('cooperate_admin_installment_debit_mail', { to: cooperative.email }, { order, purchase, payment })
  }

  async onInstallmentPaymentCompleted ({ order, payment }) {
    const purchase = order.purchases[0]
    this.sendEmail('buyer_installment_completed_mail', { to: order.buyer.email }, { order, purchase, payment })
    this.sendEmail('seller_installment_completed_mail', { to: purchase.seller.email }, { order, purchase, payment })

    const adminEmails = await models.User.find({ accountType: 'super_admin' })
      .select('-_id email')
    this.sendEmail('admin_installment_completed_mail', { to: `${CoreEvents.convertEmailsToString(adminEmails)}` }, { order, purchase, payment })
    const { cooperative } = order.buyer
    this.sendEmail('cooperate_admin_installment_completed_mail', { to: cooperative.email }, { order, purchase, payment })
  }

  async onInventoryCreated ({ product, sellerId }) {
    const seller = await models.User.findById(sellerId)
    this.sendEmail('seller_inventory_created', { to: seller.email }, { product, seller })

    const adminEmails = await models.User.find({ accountType: 'super_admin' })
      .select('-_id email')
    this.sendEmail('admin_inventory_created', { to: `${CoreEvents.convertEmailsToString(adminEmails)}` }, { product, seller })
  }

  async onRegisteredNewBuyer ({ user }) {
    const userRecord = await models.User.findById(user._id)
      .populate('cooperative')
    this.sendEmail('registered_new_buyer', { to: user.email }, { user })
    const { cooperative } = userRecord
    if (cooperative) {
      this.sendEmail('new_cooperative_member', { to: cooperative.email }, { user, cooperative })
    }
  }

  async onCooperativeMemberStatusUpdated ({ user, status }) {
    this.sendEmail('cooperative_member_status_updated', { to: user.email }, { user, status })
  }

  async onSendPasswordResetEmail ({ user }) {
    this.sendEmail('password_reset_email', { to: user.email }, { user })
  }

  async onInventoryUpdated ({ product }) {
    const seller = await models.User.findById(product.seller)
    this.sendEmail('seller_inventory_updated', { to: seller.email }, { product, seller })

    // const adminEmails = await models.User.find({ accountType: 'super_admin' })
    //   .select('-_id email')
    // this.sendEmail('admin_inventory_created',
    // { to: `${CoreEvents.convertEmailsToString(adminEmails)} }, { product, seller })
  }

  /**
   * @description Send Cart approval decline mail
   * @param {Object} approvalRecord
   * @return {Promise<void>} void
   */
  async onSellerInstallmentCartDeclined (approvalRecord) {
    const { cart: { product, user: buyer }, seller } = approvalRecord
    const cooperative = await models.User.findById(buyer.cooperative)
    const adminEmails = await models.User.find({ accountType: 'super_admin' })
      .select('-_id email')

    this.sendEmail('buyer_installment_cart_declined_mail',
      { to: `${CoreEvents.convertEmailsToString(adminEmails)}, ${cooperative.email}` },
      { product, buyer, seller })

    this.sendEmail('admin_installment_cart_declined_mail',
      { to: `${CoreEvents.convertEmailsToString(adminEmails)}, ${cooperative.email}` },
      { product, buyer, seller })
  }

  async onInstallmentCartApprovalRequestAdmin (approvalRecord) {
    const { cart, cart: { product, user: buyer }, seller } = approvalRecord
    const cooperative = await models.User.findById(buyer.cooperative)

    const adminEmails = await models.User.find({ accountType: 'super_admin' })
      .select('_id email')

    // send notification email to all admin and the user cooperative admin
    if (adminEmails.length) {
      for (let index = 0; index < adminEmails.length; index += 1) {
        if (adminEmails[index].email) {
          this.sendEmail('admin_cart_item_confirmation_request_mail',
            { to: adminEmails[index].email },
            {
              cart,
              product,
              buyer,
              seller,
              approvalRecord,
              admin: adminEmails[index]
            })
        }
      }
    }
    this.sendEmail('admin_cart_item_confirmation_request_mail',
      { to: cooperative.email },
      {
        cart,
        product,
        buyer,
        seller,
        approvalRecord,
        admin: cooperative
      })
  }

  async onInstallmentCartAdminApproved (approvalRecord) {
    const { cart, cart: { product, user: buyer }, seller } = approvalRecord
    // Notify seller
    this.sendEmail('seller_installment_cart_approved_mail',
      { to: seller.email },
      {
        cart, product, buyer, seller
      })

    // Notify buyer
    this.sendEmail('buyer_installment_cart_approved_mail',
      { to: seller.email },
      {
        cart, product, buyer, seller
      })
  }

  async onInstallmentCartAdminDeclined (approvalRecord) {
    const { cart: { product, user: buyer }, seller } = approvalRecord
    // Notify seller
    this.sendEmail('seller_installment_cart_declined_mail',
      { to: seller.email },
      { product, buyer, seller })

    // Notify buyer
    this.sendEmail('buyer_installment_cart_declined_mail',
      { to: seller.email },
      { product, buyer, seller })
  }

  async onBuyerMandateFormDetails ({ order, mandateFormUrl}) {
    // Notify seller
    this.sendEmail('buyer_mandate_form_mail',
      { to: order.buyer.email },
      { order, mandateFormUrl })
  }
}

module.exports = new CoreEvents()
