/* eslint-disable no-inner-declarations,require-jsdoc */
const moment = require('moment')
const mailer = require('./../../utils/mailer')
const sha512 = require('crypto-js/sha512')

const { constants, remitaConfig } = require('../../utils/helpers')
const { queryFilters } = require('./../../utils/helper-functions')
const notificationEvents = require('../../utils/notificationEvents')
const remitaServices = require('../../utils/remitaServices')

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
  const order = await req.Models.Order.create({
    buyer: req.body.userId,
    address,
    totalProduct: cartItemsWithoutInstallment.length,
    totalQuantities,
    subTotal,
    orderStatus: constants.ORDER_STATUS.pending_payment
  })

  // create purchase record for each cart item
  const promises = cartItemsWithoutInstallment.map(async (cartItem, x) => {
    const purchaseRecord = await req.Models.Purchase.create({
      product: cartItemsWithoutInstallment[x].product.toObject(),
      order: order._id,
      seller: cartItemsWithoutInstallment[x].product.seller._id,
      quantity: cartItemsWithoutInstallment[x].quantity,
      unitPrice: cartItemsWithoutInstallment[x].unitPrice,
      subTotal: cartItemsWithoutInstallment[x].subTotal,
      hasInstallment: false,
      meta: cartItemsWithoutInstallment[x].meta,
      status: constants.ORDER_STATUS.pending_payment
    })
    return purchaseRecord
  })
  let purchaseIds = await Promise.all(promises)
  // get the id of the created records
  purchaseIds = purchaseIds.map(record => record._id)

  order.purchases = purchaseIds
  order.save((error) => {
    if (error) throw new Error(error)
  })
  return order ? Promise.resolve(order) : Promise.reject(new Error('Order Could\'t not be created'))
}
const create = async (req, res) => {
  const responsePayload = { success: false, message: 'Validation failed', data: { errors: {} } }

  // Check if a coupon/gift-card is supplied, then assert if coupon code is valid
  // TODO:: Check if a coupon/gift-card is supplied, then assert if coupon code is valid

  // Get current users cart records without installment
  const currentUserCart = await req.Models.Cart.find({ user: req.body.userId })
    .populate({
      path: 'product',
      populate: { path: 'seller', select: '_id name firstName lastName email' }
    })
    .populate({ path: 'product', populate: { path: 'category' } })

  // Get items with no installment
  const cartItemsWithoutInstallment = currentUserCart
    .filter(cartItem => !cartItem.installmentPeriod || cartItem.installmentPeriod === 0)


  // Assert that the user has items in cart
  if (!cartItemsWithoutInstallment.length) {
    responsePayload.data.errors.cart = ['You don\'t have any item in your cart, valid for checkout']
    return res.status(400).send(responsePayload)
  }


  /** Get the user's shipping address */
  const address = await req.Models.AddressBook.findOne({ _id: req.body.address })


  /** Save orders without installment */
  const ordersWithoutInstallment = await createOrdersWithoutInstallment(
    req, address, cartItemsWithoutInstallment
  ).catch((ordersWithoutInstallmentError) => {
    throw ordersWithoutInstallmentError
  })

  res.send({ success: true, message: 'Successfully created order', data: ordersWithoutInstallment })
  // Empty current user cart with no installment
  await req.Models.Cart.deleteMany({ user: req.body.userId, installmentPeriod: undefined })
  ordersWithoutInstallment.cart = cartItemsWithoutInstallment
  notificationEvents.emit('new_order', ordersWithoutInstallment)
}

const updateOrderStatus = (req, res) => {
  req.Models.Order.findOne({ _id: req.body.orderId })
    .populate('buyer purchases')
    .exec((err, order) => {
      console.log(order)
      if (err) {
        throw err
      } else {
        if(req.body.status==="payment_completed"){
          // Notify buyer that product has been shipped by email

        }

        if(req.body.status==="delivered"){
          // Notify Seller that product has reached the buyer by email
        }
        order.orderStatus = req.body.status
        order.save()
        res.send({
          success: true,
          message: 'Order status updated successfully',
          data: order
        })


        // notify the buyer and seller of the status change
        notificationEvents.emit('order_status_changed', { order, status: req.params.status })
      }
    })
}

const getOrders = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit, 10)
    let offset = parseInt(req.query.offset, 10)
    offset = offset || 0
    limit = limit || 10

    let filter = queryFilters(req)
    filter = { buyer: req.body.userId, ...filter }

    const select = 'email firstName lastName email'
    const query = req.Models.Order.find(filter)
    query.populate('buyer', select)
    query.populate('payment')
    query.populate('approvalRecord')
    query.populate({
      path: 'purchases',
      populate: { path: 'seller', select }
    })
    // filter by date if any
    if (req.query.startDate && req.query.endDate) {
      const startDate = moment(new Date(req.query.startDate)).format()
      const endDate = moment(new Date(req.query.endDate)).add(1, 'day').format()
      const dateFilter = { createdAt: { $gt: startDate, $lt: endDate } }
      filter = { ...filter, ...dateFilter }
      query.where(dateFilter)
    }
    const resultCount = await req.Models.Order.countDocuments(filter)
    query.select('-token')
    query.skip(offset)
    query.limit(limit)
    query.sort({ createdAt: 'desc' })

    const results = await query
    res.send({
      success: true,
      message: 'Successfully fetching orders',
      data: {
        offset,
        limit,
        resultCount,
        results
      }
    })
  } catch (error) {
    res.status(500).send('Oops! An error occurred. If error persist please notify admin')
    req.log(error)
  }
}

const _createInstallmentRelatedRecords = async (req, address, cart, bankAccount) => {
  // save the installment order
  const savedInstallmentOrder = await req.Models.Order.create({
    buyer: req.authData.userId, // save the current user as the buyer
    address,
    totalProduct: 1,
    totalQuantities: cart.quantity,
    subTotal: cart.subTotal,
    installmentPeriod: cart.installmentPeriod,
    installmentPercentage: cart.installmentPercentage,
    installmentTotalRepayment: cart.installmentTotalRepayment,
    installmentPaymentStatus: constants.ORDER_STATUS.pending,
    orderStatus: constants.ORDER_STATUS.approved,
    installmentPaymentMandate: { bankAccount }, // Save bank account object(In case user deletes it)
    approvalRecord: cart.approvalRecord // Saved the related cart record
  })
  if (savedInstallmentOrder) {
    // create record for the purchased item
    const createPurchaseRecord = await req.Models.Purchase.create({
      product: cart.product.toObject(),
      order: savedInstallmentOrder._id,
      seller: cart.product.seller._id,
      quantity: cart.quantity,
      unitPrice: cart.unitPrice,
      subTotal: cart.installmentTotalRepayment,
      hasInstallment: true,
      meta: cart.meta,
      status: constants.ORDER_STATUS.approved
    })
    savedInstallmentOrder.purchases.push(createPurchaseRecord._id)
    savedInstallmentOrder.save()
    // reduce the available quantity once order has been created
    if (cart.product.quantity) {
      cart.product.quantity -= cart.quantity
      cart.product.save()
    }
    return Promise.resolve(savedInstallmentOrder)
  }
  return Promise.reject(new Error('Could not create installment order'))
}


const createInstallmentOrder = async (req, res) => {
  try {
    const responsePayload = { success: false, message: 'Validation failed', data: { errors: {} } }

    // Get the cart record with the supplied cart Id and the current user id
    const cart = await req.Models.Cart
      .findOne({ _id: req.body.cartId, user: req.authData.userId })
      .populate({
        path: 'product',
        populate: { path: 'seller', select: '_id name firstName lastName email' }
      })
      .populate({ path: 'product', populate: { path: 'category' } })
      .populate('approvalRecord')

    // Asset that the cart record is available
    if (!cart) {
      responsePayload.data.errors.cart = ['The specified cart item is not available on your list']
      return res.status(400).send(responsePayload)
    }

    // Asset that approval has been requested
    if (!cart.approvalRecord) {
      responsePayload.data.errors.bankAccountId = ['Approval has not been requested for this cart.']
      return res.status(400).send(responsePayload)
    }

    // assert that this cart has been approved
    if (cart.approvalRecord.adminApprovalStatus !== constants.ORDER_STATUS.approved) {
      responsePayload.data.errors.bankAccountId = ['This cart is not valid for checkout, still waiting admin approval']
      return res.status(400).send(responsePayload)
    }

    const bankAccountDetails = await req.Models.BankAccount
      .findOne({ _id: req.body.bankAccountId, user: req.body.userId })
    // assert that the bankAccount is valid
    if (!bankAccountDetails) {
      responsePayload.data.errors.bankAccountId = ['Invalid bank account record supplied']
      return res.status(400).send(responsePayload)
    }

    // Get the user's shipping address
    const address = await req.Models.AddressBook.findOne({ _id: req.body.addressId })
    const orderRecord = await _createInstallmentRelatedRecords(req, address,
      cart, bankAccountDetails.toObject())

    const order = await req.Models.Order.findById(orderRecord._id)
      .populate('buyer purchases')

    // After saving order and purchase record, setUp payment mandate on Remita payment mandate
    const { bankAccount } = order.installmentPaymentMandate
    const mandateResponse = await remitaServices._setUpMandate({
      payerName: `${order.installmentPaymentMandate.bankAccount.accountName}`,
      payerEmail: `${order.buyer.email}`,
      payerPhone: `${order.buyer.phoneNumber}`,
      payerBankCode: `${order.installmentPaymentMandate.bankAccount.bankCode}`,
      payerAccount: `${order.installmentPaymentMandate.bankAccount.accountNumber}`,
      requestId: `${order.orderNumber}`,
      amount: `${order.installmentTotalRepayment}`,
      startDate: `${moment().format('D/MM/Y')}`,
      endDate: `${moment().add(order.installmentPeriod, 'months').format('D/MM/Y')}`,
      mandateType: 'SO',
      frequency: 'Month'
    })
    if (mandateResponse === 'remita-error') {
      // Delete the create order and purchase record
      if (order.purchases && order.purchases[0]) order.purchases[0].delete()
      order.delete()
      return res.status(500).send('Oops! An error occurred connecting to Remita. If error persist please notify admin')
    }

    const { merchantId, apiKey, baseUrlHttp } = remitaConfig
    const hash = sha512(`${merchantId}${apiKey}${order.orderNumber}`).toString()
    // update the order record with the generated mandate form URL and additional details
    order.installmentPaymentMandate = {
      bankAccount,
      status: false,
      hash,
      formUrl: `${baseUrlHttp}/ecomm/mandate/form/${merchantId}/${hash}/${mandateResponse.mandateId}/${mandateResponse.requestId}/rest.reg`,
      mandateId: mandateResponse.mandateId,
      requestId: mandateResponse.requestId,
      merchantId,
    }
    // create installment repayment schedule
    for (let i = 1; i <= order.installmentPeriod; i += 1) {
      order.installmentsRepaymentSchedule.push({
        installmentRef: `${order.orderNumber}_${i}`, // concat with order number
        installmentPercentage: order.installmentPercentage,
        amount:
          order.installmentTotalRepayment / order.installmentPeriod,
        dueDate: moment()
          .add(i, 'month')
          .format()
      })
    }
    // Save all modifications
    order.save()
    // remove cart item
    cart.delete()
    res.send({ success: true, message: 'Order created successfully', data: order })

    // Send an email to the customer regarding installment purchase and mandate form URL
    notificationEvents.emit('buyer_mandate_form_details', {
      order,
      mandateFormUrl: order.installmentPaymentMandate.formUrl
    })
  } catch (error) {
    res.status(500).send('Oops! An error occurred. If error persist please notify admin')
    req.log(error)
  }
}

module.exports = {
  create,
  updateOrderStatus,
  getOrders,
  createInstallmentOrder
}
