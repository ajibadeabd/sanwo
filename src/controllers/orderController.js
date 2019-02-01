const nodemailer = require('nodemailer')
const moment = require('moment')
const crypto = require('crypto')
const mailer = require('./../../utils/mailer')

const _createInstallmentOrder = async (req, address, installmentItemInCart) => {
  // save the installment order
  const savedInstallmentOrder = await req.Models.Order.create({
    buyer: req.body.userId, // save the current user as the buyer
    address,
    cart: installmentItemInCart.toObject(), // convert mongoDB object to actual object
    totalProduct: 1,
    totalQuantities: installmentItemInCart.quantity,
    subTotal: installmentItemInCart.subTotal,
    installmentPeriod: installmentItemInCart.installmentPeriod,
    installmentPercentage: installmentItemInCart.installmentPercentage,
    installmentTotal: installmentItemInCart.installmentTotal,
    installmentPaymentStatus: 'pending',
    orderStatus: 'pending-approval',
  })
  if (savedInstallmentOrder) {
    const installments = []
    // create installment repayment schedule
    for (let i = 1; i <= installmentItemInCart.installmentPeriod; i += 1) {
      installments.push({
        installmentRef: `${savedInstallmentOrder.orderNumber}_${i}`, // concat with order number
        installmentPercentage: installmentItemInCart.installmentPercentage,
        amount: installmentItemInCart.installmentTotal / installmentItemInCart.installmentPeriod,
        dueDate: moment()
          .add(i, 'month')
          .format()
      })
    }
    savedInstallmentOrder.installments = installments
    // generate token for order approval
    crypto.randomBytes(20, (error, buffer) => {
      if (error) throw error
      savedInstallmentOrder.token = buffer.toString('hex')
      savedInstallmentOrder.save((tokenError) => {
        if (tokenError) throw tokenError
        // reduce the available quantity once order has been created
        if (installmentItemInCart.product.quantity) {
          installmentItemInCart.product.quantity -= installmentItemInCart.quantity
          installmentItemInCart.product.save()
        }
      })
    })
    return Promise.resolve(savedInstallmentOrder)
  }
  return Promise.reject(new Error('Could not create installment order'))
}

const createOrdersWithoutInstallment = async (req, address, cartItemsWithoutInstallment) => {
  let totalQuantities = 0
  let subTotal = 0
  for (let i = 0; i <= cartItemsWithoutInstallment.length; i += 1) {
    if (cartItemsWithoutInstallment[i]) {
      totalQuantities += cartItemsWithoutInstallment[i].quantity
      subTotal += cartItemsWithoutInstallment[i].subTotal
      if (cartItemsWithoutInstallment[i].product.quantity) {
        // remove the quantity order for from the available product quantity
        cartItemsWithoutInstallment[i].product.quantity -= cartItemsWithoutInstallment[i].quantity
        cartItemsWithoutInstallment[i].product.save()
      }
    }
  }
  // convert each cart item from mongoDB object to actual object
  cartItemsWithoutInstallment = cartItemsWithoutInstallment.map(cart => cart.toObject())
  const order = await req.Models.Order.create({
    buyer: req.body.userId,
    address,
    cart: cartItemsWithoutInstallment,
    totalProduct: cartItemsWithoutInstallment.length,
    totalQuantities,
    subTotal,
  })
  return order ? Promise.resolve(order) : Promise.reject(new Error('Order Could\'t not be created'))
}
const create = async (req, res) => {
  const responsePayload = { success: false, message: 'Validation failed', data: { errors: {} } }

  /** Check if a coupon/gift-card is supplied, then assert if coupon code is valid  */
  // TODO:: Check if a coupon/gift-card is supplied, then assert if coupon code is valid

  /** Get current users cart */
  const currentUserCart = await req.Models.Cart.find({ user: req.body.userId })
    .populate({
      path: 'product',
      populate: { path: 'seller', select: '_id name firstName lastName email' }
    })

  /** Assert that the user has items in cart */
  if (!currentUserCart.length) {
    responsePayload.data.errors.cart = ['You don\'t have any item in your cart']
    return res.status(400).send(responsePayload)
  }

  /** Get item to be paid for on installment(if any) */
  const installmentItemInCart = currentUserCart
    .filter(cartItem => cartItem.installmentPeriod > 1)

  /** Assert that the customer doesn't have a pending installmentPayment request */
  if (installmentItemInCart.length) {
    const pendingRequest = await req.Models.Order.findOne({ buyer: req.body.userId, orderStatus: 'pending-approval' })
    if (pendingRequest) {
      responsePayload.data.errors.cart = ['You have a pending installment payment request. You can\'t make a new order on installment, please review your cart']
      return res.status(400).send(responsePayload)
    }
  }

  /** Get items with no installment */
  const cartItemsWithoutInstallment = currentUserCart
    .filter(cartItem => cartItem.installmentPeriod === 0)

  /** Get the user's shipping address */
  const address = await req.Models.AddressBook.findOne({ _id: req.body.address })

  /** Save installment Order if any */
  let installmentOrder
  if (installmentItemInCart.length) {
    installmentOrder = await _createInstallmentOrder(req, address, installmentItemInCart[0])
      .catch((installmentOrderError) => {
        throw installmentOrderError
      })
  }

  /** Save orders without installment */
  let ordersWithoutInstallment
  let approvalToken
  if (cartItemsWithoutInstallment) {
    ordersWithoutInstallment = await createOrdersWithoutInstallment(
      req, address, cartItemsWithoutInstallment
    ).catch((ordersWithoutInstallmentError) => {
      throw ordersWithoutInstallmentError
    })
    approvalToken = installmentOrder.token
    installmentOrder.token = null // remove the generated token as part of the return token
  }

  const msg = installmentItemInCart.length ? '. Your installment payment request has been sent to your cooperative for approval. You order status will be updated once approved or rejected' : ''

  const orderPayload = {
    ordersWithoutInstallment,
    installmentOrder,
  }
  res.send({
    success: true,
    message: `Successfully created order${msg}`,
    data: orderPayload
  })
  await mailer.sendNewOrderMail(ordersWithoutInstallment, req)
  await mailer.sendInstallmentOrderApprovalMail(approvalToken, installmentOrder, req)
}

const updateApprovalStatus = async (req, res) => {
  const subject = `${process.env.APP_NAME}: Order`
  req.Models.Order.findOne({ token: req.params.token })
    .populate('buyer')
    .exec((err, order) => {
      if (err) {
        throw err
      } else if (order) {
        order.orderStatus = req.params.status
        order.token = undefined
        order.approvalStatusChangedBy = req.params.adminId
        order.approvalStatusChangeDate = Date.now()
        order.save()
        res.send({
          success: true,
          message: `Order status has been updated to ${req.params.status}. The buyer has been notified.`
        })
        // if the purchase is declined add the quantity back to available products
        if (req.params.status === 'declined') {
          req.Models
            .Inventory.findOne({ _id: order.cart[0].product._id }).then((result) => {
            // since we are sure buyers can't buy more than one installment product
              result.quantity += 1
              result.save()
            })
        }

        // Notify the buyer of the new satus update
        const buyerMessage = `<div>
        Hi ${order.buyer.lastName} ${order.buyer.firstName}, your order number <strong>#${order.orderNumber}</strong>
        Has been ${req.params.status}
        <p>Login to your account to see more details</p>
        </div>`
        mailer.sendMail(order.buyer.email, `Order Status: #${order.orderNumber}`,
          buyerMessage, (mailErr, mailRes) => {
            if (mailErr) req.log(`${subject} MAIL not sent to ${order.buyer.email}`)
            if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
          }, `${process.env.MAIL_FROM}`)
        const { seller } = order.cart[0].product
        // Notify the seller of the new order
        const sellerMessage = `<div>
        Hi ${seller.lastName} ${seller.firstName}, request to buy your product on installment has been ${req.params.status}
        below is the order details
        <p>Customer Name: <strong>${order.buyer.lastName} ${order.buyer.firstName}</strong></p>
        <p>Order Number <strong>#${order.orderNumber}</strong></p>
        <p>Login to take action</p>
        </div>`
        mailer.sendMail(seller.email, subject, sellerMessage, (mailErr, mailRes) => {
          if (mailErr) req.log(`${subject} MAIL not sent to ${seller.email}`)
          if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
        }, `${process.env.MAIL_FROM}`)
      } else {
        res.status(400)
          .send({
            success: false,
            message: 'The token does not exist or has already been used',
            data: err
          })
      }
    })
}

const updateOrderStatus = (req, res) => {
  req.Models.Order.findOne({ _id: req.body.orderId })
    .populate('buyer')
    .exec((err, order) => {
      if (err) {
        throw err
      } else {
        order.orderStatus = req.body.status
        order.save()
        res.send({
          success: true,
          message: 'Order status updated successfully',
          data: err
        })

        // notify the buyer and seller of the status change
        const subject = `Order Status: #${order.orderNumber}`
        const buyerMessage = `<div>
        Hi ${order.buyer.lastName} ${order.buyer.firstName},
        your order number <strong>#${order.orderNumber}</strong>
        status changed to ${req.body.status}
        <p>Login to your account to see more details</p>
        </div>`
        mailer.sendMail(order.buyer.email, subject,
          buyerMessage, (mailErr, mailRes) => {
            if (mailErr) req.log(`${subject} MAIL not sent to ${order.buyer.email}`)
            if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
          }, `${process.env.MAIL_FROM}`)

        const sellerMessage = `<div>
        Hi ${order.seller.lastName} ${order.seller.firstName},
        Order number <strong>#${order.orderNumber}</strong>
        status changed to ${req.body.status}
        <p>Login to your account to see more details</p>
        </div>`
        mailer.sendMail(order.seller.email, subject,
          sellerMessage, (mailErr, mailRes) => {
            if (mailErr) req.log(`${subject} MAIL not sent to ${order.buyer.email}`)
            if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
          }, `${process.env.MAIL_FROM}`)
      }
    })
}

const getOrders = (req, res) => {
  let limit = parseInt(req.query.limit)
  let offset = parseInt(req.query.offset)
  offset = offset || 0
  limit = limit || 10

  let filter = { buyer: req.body.userId }
  if (req.query.orderStatus) filter = { ...filter, orderStatus: req.query.orderStatus }

  const query = req.Models.Order.find(filter)
  query.populate('buyer', 'email firstName lastName email')
  query.select('-token')
  query.skip(offset)
  query.limit(limit)
  query.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching orders',
        data: {
          offset,
          limit,
          resultCount: results.length,
          results
        }
      })
    }
  })
}

module.exports = {
  create,
  updateApprovalStatus,
  updateOrderStatus,
  getOrders
}
