const nodemailer = require('nodemailer')
const helpers = require('./../functions/helpers')

const create = (req, res) => {
  // if the buyer doesn't set instNumber, it means he's paying onetime
  if (!req.body.instNumber) req.body.instNumber = 1
  // first let's get the product our customer is buying so we can get original item price
  req.Models.Inventory.findOne({ _id: req.body.product })
    .populate('seller')
    .exec((err, product) => {
      if (err) {
        throw err
      } else if (product) {
        // next we'll create the new order
        // TODO :: assert that instNumber is not greater than the value set by the seller
        /**
         * We need to know how much the customer is per/installment period
         * How much has the customer paid for this purchase and how much is remaining for this item
         */
        req.Models.Order.create({
          orderDate: Date.now(),
          quantity: req.body.quantity,
          orderPrice: product.price * req.body.quantity,
          product: product.id,
          instNumber: product.price * req.body.quantity / req.body.instNumber,
          buyer: req.body.userId,
          seller: product.seller._id
        }, (error, order) => {
          if (error) {
            throw error
          } else {
            res.json({
              status: 'success',
              message: 'Order Created Successfully',
              data: order
            })
              .status(201)
            helpers.sendOrderNewOrderMail({
              order,
              product
            }, req)
          }
          // TODO :: decrease purchased quantity from products quantity
        })
      } else {
        return res.json({
          status: false,
          message: 'The product your trying to purchase could not be found',
          data: null
        })
          .status(400)
      }
    })
}

const updateApprovalStatus = (req, res) => {
  const subject = `${process.env.APP_NAME}: Order`
  req.Models.Order.findOne({
    token: req.params.token
  })
    .populate('buyer seller product')
    .exec((err, order) => {
      if (err) {
        throw err
      } else if (order) {
        order.orderStatus = req.params.status
        order.token = undefined
        order.approvedBy = req.params.adminId
        order.approvalDate = Date.now()
        order.save()
        res.send({
          success: true,
          message: `Order status has been updated to ${req.params.status}. The buyer has been notified.`
        })

        // Notify the seller of the new order
        const sellerMessage = `<div>
        Hi ${order.seller.lastName} ${order.seller.firstName}, you have a new Order on ${process.env.APP_NAME}
        below is the order details
        <p>Order Number <strong>#${order.orderNumber}</strong></p>
        <p>Login to take action</p>
        </div>`
        helpers.sendMail(order.seller.email, subject, sellerMessage, (mailErr, mailRes) => {
          if (mailErr) req.log(`${subject} MAIL not sent to ${order.seller.email}`)
          if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
        }, `${process.env.MAIL_FROM}`)

        // Notify the buyer of the new satus update
        const buyerMessage = `<div>
        Hi ${order.buyer.lastName} ${order.buyer.firstName}, your order number <strong>#${order.orderNumber}</strong>
        Has been ${req.params.status}
        <p>Login to your account to see more details</p>
        </div>`
        helpers.sendMail(order.buyer.email, `Order Status: #${order.orderNumber}`,
          buyerMessage, (mailErr, mailRes) => {
            if (mailErr) req.log(`${subject} MAIL not sent to ${order.buyer.email}`)
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
    .populate('buyer seller')
    .exec((err, order) => {
      if (err) {
        throw err
      } else {
        order.orderStatus = req.body.status
        order.save()
        res.send({
          success: true,
          message: 'Product status updated successfully',
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
        helpers.sendMail(order.buyer.email, subject,
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
        helpers.sendMail(order.seller.email, subject,
          sellerMessage, (mailErr, mailRes) => {
            if (mailErr) req.log(`${subject} MAIL not sent to ${order.buyer.email}`)
            if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
          }, `${process.env.MAIL_FROM}`)
      }
    })
}

module.exports = {
  create,
  updateApprovalStatus,
  updateOrderStatus
}
