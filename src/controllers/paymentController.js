const sha512 = require('crypto-js/sha512')
const helpers = require('../../utils/helpers')
const utils = require('../../utils/helper-functions')
const { _generateRRR, _getRRRStatus } = require('../../utils/remitaServices')
const events = require('./../../utils/events')

// TODO replace with correct valid credentials
const remitaConfig = {
  baseUrl: 'https://www.remitademo.net/remita',
  serviceTypeId: '4430731',
  apiKey: '1946',
  merchantId: '2547916',
}
// const theApiHash = sha512(`${remitaConfig.merchantId}230007734065${remitaConfig.apiKey}`)
// console.log(theApiHash.toString())

const _getAndUpdatePaymentStatus = async (payment) => {
  try {

    const { merchantId, apiKey } = remitaConfig
    const { transactionRef } = payment
    const apiHash = sha512(`${transactionRef}${apiKey}${merchantId}`)
    const remitaResponse = await _getRRRStatus(transactionRef, apiHash)

    const oldStatus = payment.status
    const paymentConst = helpers.constants.PAYMENT_STATUS
    const payStatus = Object
      .keys(paymentConst)[Object.values(paymentConst).indexOf(remitaResponse.status)]

    if (payStatus && (oldStatus !== remitaResponse.status)) {
      payment.status = remitaResponse.status || '/unknown-status'
      payment.meta = { ...payment.meta, ...remitaResponse }
      payment.updatedAt = Date.now()
      // payment.save()

      // update order status
      payment.order.orderStatus = helpers.constants.ORDER_STATUS.payment_completed
      payment.order.updatedAt = Date.now()
      payment.order.save()

      events.emit('payment_status_changed', { order: payment.order, buyer: payment.user },
        payStatus.replace(/_/g, ' ').toUpperCase())
    }
    return Promise.resolve(payment)
  } catch (error) {
    return Promise.reject(error)
  }
}

const generateOrderPaymentRRR = async (req, res) => {
  try {
    /** Whispers: "Be the best you can be" * */

    // first we get the order record with the passed orderNumber
    const order = await req.Models.Order
      .findOne({ orderNumber: req.body.orderNumber })
      .populate('payment')
    if (!order) {
      // if the record isn't found let the user know order doesn't exit.
      return res.send({
        success: false,
        message: 'Order does not exist',
        data: {}
      }).status(400)
    }

    // assert that the belongs to the current user
    const userOrder = await await req.Models.Order
      .findOne({ orderNumber: req.body.orderNumber, buyer: req.body.userId })
      .populate('buyer purchases')
    if (!userOrder) {
      // if the record isn't found let the user know they don't own the order.
      return res.send({
        success: false,
        message: 'You don\'t own the order you\'re trying to make payment for, please login as the right user',
        data: {}
      }).status(400)
    }

    if (userOrder.installmentPeriod) {
      return res.send({
        success: false,
        message: 'You can\'t generate RRR for an installment order.',
        data: {}
      }).status(400)
    }

    const orderHasCompletedPayment = await req.Models.Payment
      .findOne({
        order: userOrder._id,
        $or: [
          { status: helpers.constants.PAYMENT_STATUS.transaction_completed_successfully },
          { status: helpers.constants.PAYMENT_STATUS.transaction_approved },
        ]
      })

    // If payment has been completed for this order return proper message
    if (orderHasCompletedPayment) {
      return res.send({
        success: false,
        message: 'Payment has already been completed for this order',
        data: orderHasCompletedPayment
      }).stat(400)
    }


    // If RRR code has been generated for this order return the RRR
    if (order.payment && order.payment.transactionRef) {
      order.payment.hash = sha512(`${remitaConfig.merchantId}${order.payment.transactionRef}${remitaConfig.apiKey}`)
      return res.send({
        success: true,
        message: 'Successfully generated RRR',
        data: order.payment
      })
    }

    // build remita payload
    const { buyer, purchases } = order
    const rrrPayload = {
      amount: order.subTotal,
      orderId: order.orderNumber,
      payerName: `${buyer.firstName} ${buyer.lastName}`,
      payerEmail: buyer.email,
      payerPhone: buyer.phoneNumber,
      description: `Payment for ${purchases.length} product(s)`,
    }
    // add custom field containing the purchased product details
    rrrPayload.customFields = purchases.map(purchase => ({
      name: purchase.product ? purchase.product.name : '--',
      value: purchase.product
        ? `Price: ${purchase.product.price} - Quantity: ${purchase.quantity} -
      Seller: ${purchase.product.seller.firstName} ${purchase.product.seller.lastName} (${purchase.product.seller.email})` : '--',
      type: 'ALL'
    }))
    const { merchantId, serviceTypeId, apiKey } = remitaConfig

    // Generate remita apiHash
    const apiHash = sha512(`${merchantId}${serviceTypeId}${rrrPayload.orderId}${rrrPayload.amount}${apiKey}`)

    // generate the RRR code and return response accordingly
    const remitaResponse = await _generateRRR(rrrPayload, apiHash)

    // Create payment record
    const paymentRecord = await req.Models.Payment.create({
      user: buyer._id,
      order: order._id,
      amount: order.subTotal,
      transactionRef: remitaResponse.RRR,
      status: helpers.constants.PAYMENT_STATUS.pending_payment,
      channel: 'remita.net',
      meta: remitaResponse,
      hash: sha512(`${remitaConfig.merchantId}${remitaResponse.RRR}${remitaConfig.apiKey}`),
    })

    // Update the order record with the related payment _id
    order.payment = paymentRecord._id
    order.save((orderSaveError) => {
      if (orderSaveError) throw orderSaveError
    })

    res.send({
      success: true,
      message: 'Successfully generated RRR',
      data: paymentRecord
    })
  } catch (err) {
    res.send({
      success: false,
      message: 'Oops! an error occurred. Please retry, if error persist contact admin',
      data: {}
    }).status(500)
    req.log(err)
    throw new Error(err)
  }
}

const getOrderPayments = async (req, res) => {
  const order = await req.Models.Order
    .findOne({ orderNumber: req.params.orderNumber })
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10
  let filter = utils.queryFilters(req)
  filter = { user: req.body.userId, order: order._id, ...filter }
  const model = req.Models.Payment.find(filter)
  model.skip(offset)
  model.limit(limit)
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching order payments',
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

const getPayment = async (req, res) => {
  try {
    // get payment status, if payment is completed no need to check remita
    const select = 'email firstName lastName email'
    const payment = await req.Models.Payment.findById(req.params.paymentId)
      .populate('user', select)
      .populate('order')
    console.log(JSON.stringify(payment))

    // If the transaction status is completed return response
    if (payment.status === helpers.constants.PAYMENT_STATUS.transaction_completed_successfully) {
      return res.send({
        success: true,
        message: 'Successfully fetching payment',
        data: payment
      })
    }

    // If otherwise check remita for the latest payment status and update status accordingly
    const updatedPayment = await _getAndUpdatePaymentStatus(payment)

    return res.send({
      success: true,
      message: 'Successfully fetching payment',
      data: updatedPayment
    })
  } catch (err) {
    res.send({
      success: true,
      message: 'Oops! an error occurred. Please retry, if error persist contact admin',
      data: {}
    }).status(500)
    throw new Error(err)
  }
}

const notification = async (req, res) => {
  try {
    const payment = await req.Models.Payment.findOne({ transactionRef: req.query.RRR })
      .populate('user')
      .populate('order', { populate: ['purchases'] })
    const updatedPayment = await _getAndUpdatePaymentStatus(payment)
    res.json(updatedPayment)
    // do remaining payment status change operation
  } catch (err) {
    res.send({
      success: true,
      message: 'Oops! an error occurred. Please retry, if error persist contact admin',
      data: {}
    }).status(500)
    throw new Error(err)
  }
}

module.exports = {
  generateOrderPaymentRRR,
  getOrderPayments,
  getPayment,
  notification
}
