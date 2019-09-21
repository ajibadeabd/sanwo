const moment = require('moment')
const { constants } = require('../../utils/helpers')
const notificationEvents = require('./../../utils/notificationEvents')

const { queryFilters } = require('../../utils/helper-functions')

const get = (req, res) => {
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10

  let filter = { seller: req.body.userId }
  filter = { ...filter, ...queryFilters(req) }
  const select = 'email firstName lastName email'
  const query = req.Models.Purchase.find(filter)
  query.populate('seller', select)
  query.populate({
    path: 'order',
    populate: { path: 'buyer', select }
  })
  // filter by date if any
  if (req.query.startDate && req.query.endDate) {
    const startDate = moment(new Date(req.query.startDate)).format()
    const endDate = moment(new Date(req.query.endDate)).add(1, 'day').format()
    query.where({ createdAt: { $gt: startDate, $lt: endDate } })
  }
  query.select('-token')
  query.skip(offset)
  query.limit(limit)
  query.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching purchases',
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

const update = (req, res) => {
  // check that this seller is trying to change status to either in_route or delivered
  if (req.body.status && (req.body.status !== constants.ORDER_STATUS.in_route
    && req.body.status !== constants.ORDER_STATUS.delivered)) {
    return res.status(403).send({
      success: false,
      message: 'A seller can only update purchase status to delivered or in_route',
      data: []
    })
  }

  req.Models.Purchase.findOne({ _id: req.params.purchaseId, seller: req.body.userId })
    .populate('seller')
    .populate({
      path: 'order',
      populate: { path: 'buyer', select: 'email firstName lastName email' }
    })
    .exec((err, purchase) => {
      if (err) {
        throw err
      } else if (purchase) {
        const { order } = purchase

        /** If order status is pending-approval return */
        if (order.orderStatus === constants.ORDER_STATUS.pending_approval) {
          return res.status(400)
            .send({
              success: false,
              message: 'The purchase order is pending approval',
              data: []
            })
        }

        /** If order status is declined return */
        if (order.orderStatus === constants.ORDER_STATUS.declined) {
          return res.status(400)
            .send({
              success: false,
              message: 'The purchase order is declined',
              data: []
            })
        }
        const oldStatus = purchase.status
        const oldTrackingDetails = purchase.trackingDetails
        purchase.status = req.body.status || purchase.status
        purchase.trackingDetails = req.body.trackingDetails || purchase.trackingDetails
        purchase.save()
        res.send({
          success: true,
          message: 'Order status updated successfully',
          data: purchase
        })

        // send email if status changed
        if (req.body.status && oldStatus !== req.body.status) {
          // notify the buyer and seller of the status change

          notificationEvents.emit('purchase_status_changed', {
            order,
            status: req.body.status,
            purchase
          })
        }
        // Send email if tracking details changed
        if (req.body.trackingDetails && (oldTrackingDetails !== req.body.trackingDetails)) {
          const { trackingDetails } = req.body
          notificationEvents.emit('tracking_details_added', { order, trackingDetails })
        }
      } else {
        res.status(404)
          .send({
            success: false,
            message: 'Purchase record not found',
            data: []
          })
      }
    })
}

const buyerStatusUpdate = async (req, res) => {
  if (req.body.status !== constants.ORDER_STATUS.confirmed
    && req.body.status !== constants.ORDER_STATUS.declined) {
    return res.status(403).send({
      success: false,
      message: 'A buyer can only confirm or decline a purchase',
      data: []
    })
  }

  const purchase = await req.Models.Purchase
    .findOne({ _id: req.params.purchaseId })
    .populate('seller')
    .populate({
      path: 'order',
      populate: { path: 'buyer', select: 'email firstName lastName email' }
    })
    .populate({
      path: 'order',
      populate: { path: 'purchases' }
    })

  if (purchase.order.buyer._id.toString() !== req.body.userId) {
    return res.status(403).send({
      success: false,
      message: 'The purchase record doesn\'t belong to you',
      data: []
    })
  }

  // A user must have paid for a purchase before the can decline
  // if (purchase.status === constants.ORDER_STATUS.declined
  //   && (purchase.status !== constants.ORDER_STATUS.payment_completed)) {
  //   return res.status(403).send({
  //     success: false,
  //     message: 'You must complete payment before you can decline an other',
  //     data: []
  //   })
  // }

  purchase.status = req.body.status
  purchase.save()

  res.send({
    success: true,
    message: 'Purchase updated successfully',
    data: purchase
  })

  const { purchases } = purchase.order
  const allPurchaseItemConfirmed = purchases
    .every(purchaseItem => purchaseItem.status === constants.ORDER_STATUS.confirmed)

  const { order } = purchase
  notificationEvents.emit('purchase_status_changed', {
    order,
    status: req.body.status,
    purchase
  })
  if (allPurchaseItemConfirmed) {
    purchase.order.status = constants.ORDER_STATUS.confirmed
    purchase.order.save()
    notificationEvents.emit('completed_order_mail', {
      order,
      status: req.body.status,
      purchase
    })
  }
}

module.exports = {
  get,
  update,
  buyerStatusUpdate
}
