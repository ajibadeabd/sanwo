const nodemailer = require('nodemailer')
const moment = require('moment')
const { constants } = require('../../utils/helpers')
const mailer = require('./../../utils/mailer')

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
  // TODO validate account type and status update
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
          return res.status(400).send({
            success: false,
            message: 'The purchase order is pending approval',
            data: []
          })
        }

        /** If order status is declined return */
        if (order.orderStatus === constants.ORDER_STATUS.declined) {
          return res.status(400).send({
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
        if (oldStatus !== req.body.status) {
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
        Hi ${purchase.seller.lastName} ${purchase.seller.firstName},
        Order number <strong>#${order.orderNumber}</strong>
        status changed to ${req.body.status}
        <p>Login to your account to see more details</p>
        </div>`
          mailer.sendMail(purchase.seller.email, subject,
            sellerMessage, (mailErr, mailRes) => {
              if (mailErr) req.log(`${subject} MAIL not sent to ${purchase.seller.email}`)
              if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
            }, `${process.env.MAIL_FROM}`)
        }

        // Send email if tracking details changed
        if (oldTrackingDetails !== req.body.trackingDetails) {
          const subject = `Tracking Details Added For Order: #${order.orderNumber}`

          const trackingMessage = `<div>
        Hi ${order.buyer.lastName} ${order.buyer.firstName},
        Tracking details has been added for your order number <strong>#${order.orderNumber}</strong>
        <p> <strong>Tracking Details</strong><br/>${req.body.trackingDetails}</p>
        <p>Login to your account to see more details</p>
        </div>`
          mailer.sendMail(order.buyer.email, subject,
            trackingMessage, (mailErr, mailRes) => {
              if (mailErr) req.log(`${subject} MAIL not sent to ${order.buyer.email}`)
              if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
            }, `${process.env.MAIL_FROM}`)
        }
      } else {
        res.status(404).send({
          success: false,
          message: 'Purchase record not found',
          data: []
        })
      }
    })
}

module.exports = {
  get,
  update
}
