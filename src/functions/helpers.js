const fs = require('fs')
const nodemailer = require('nodemailer')
const crypto = require('crypto')

const constants = {
  SELLER: 'seller',
  BUYER: 'buyer',
  CORPORATE_ADMIN: 'corporate_admin',
  SUPER_ADMIN: 'super_admin',
  ACCOUNT_STATUS: {
    pending: 'pending',
    accepted: 'accepted',
    declined: 'declined',
    suspended: 'suspended',
  },
  ORDER_STATUS: {
    pending: 'pending',
    approved: 'approved',
    declined: 'declined',
    in_route: 'in_route',
    delivered: 'delivered',
    confirmed: 'confirmed',
  }
}

const sendMail = (to, subject, mailBody, callback, from = null) => {
  const mailOptions = {
    from: from || process.env.MAIL_FROM, // sender address
    sender: process.env.APP_NAME, // sender address
    to, // list of receivers
    subject, // Subject line
    html: mailBody // html body
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    }
  })

  transporter.sendMail(mailOptions, (error, response) => {
    if (error) {
      callback(error, null)
    } else {
      callback(null, response)
    }
    // shut down the connection pool, no more messages
    transporter.close()
  })
}


const sendWelcomeMail = (user, req) => {
  const { lastName, email } = user
  const messageBody = `<p>Hello ${lastName} we are happy to have you at ${process.env.APP_NAME}</p>
                    <p>Follow this link to learn more about us<br/><a href=${process.env.APP_URL}
    >Learn more</a></p>`
  const subject = `Welcome to ${process.env.APP_NAME}`

  sendMail(email, subject, messageBody, (mailErr, mailRes) => {
    if (mailErr) {
      req.log('MAIL not sent')
    }
    if (mailRes) req.log('Message sent: %s', mailRes.messageId)
  }, `${process.env.MAIL_FROM}`)
}


const sendPasswordResetEmail = (user, req) => {
  const { lastName, email, resetPasswordToken } = user
  const messageBody = `<p>Hello ${lastName || ','} here's your password reset link <br/>
        <a href=${process.env.APP_URL}/users/password-reset?token=${resetPasswordToken}>
        ${process.env.APP_URL}/users/password-reset?token=${resetPasswordToken}
        </a></p>`
  const subject = `${process.env.APP_NAME}: Password Reset`

  sendMail(email, subject, messageBody, (mailErr, mailRes) => {
    if (mailErr) {
      req.log(`${subject} MAIL not sent to ${email}`)
    }

    if (mailRes) {
      req.log(`Message sent: %s ${mailRes.messageId}`)
      req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
    }
  }, `${process.env.MAIL_FROM}`)
}

const sendOrderNewOrderMail = async ({ order, product }, req) => {
  // TODO implement email notification to buyer, seller, co-operative admin and super admin
  try {
    let token = ''
    crypto.randomBytes(20, (error, buffer) => {
      if (error) throw error
      token = buffer.toString('hex')
      //  update to token
      req.Models.Order.findOneAndUpdate({ orderNumber: order.orderNumber },
        { token },
        {
          upsert: true,
          new: true
        })
        .exec((err, result) => {
          if (err) throw err
        })
    })
    const buyer = await req.Models.User.findOne({ _id: order.buyer })
      .populate('cooperative')
      .then(user => user)

    let adminEmails = await req.Models.User.find({ accountType: constants.SUPER_ADMIN })
      .select('-_id email')
      .then(user => user)
    adminEmails = adminEmails.map(adminUser => adminUser.email)

    const subject = `${process.env.APP_NAME}: New Order`
    const orderDetails = `<h3>Order Details</h3>
        <table>
        <tr><th>Product Name</th><td>${product.itemName}</td></tr>
        <tr><th>Description</th><td>${product.description}</td></tr>
        <tr><th>Price</th><td>${product.price}</td></tr>
        <tr><th>Quantity</th><td>${order.quantity}</td></tr>
        <tr><th>Total Price</th><td>${order.orderPrice}</td></tr>
        </table>`
    // let's notify the buyer of their new order
    const buyerMessage = `<div>
        Hello ${buyer.lastName || ','} thank you for using ${process.env.APP_NAME} <br/>
        <p>Your order number <strong>#${order.orderNumber}</strong> is currently 
        <strong>PENDING</strong> you'll be notified of the status once processed</p>
        ${orderDetails}
        </div>`

    sendMail(buyer.email, subject, buyerMessage, (mailErr, mailRes) => {
      if (mailErr) req.log(`${subject} MAIL not sent to ${buyer.email}`)
      if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
    }, `${process.env.MAIL_FROM}`)

    const orderAction = `Your action is needed for this order 
        APPROVE : <a href="${process.env.APP_URL}/purchase/update-approval-status/${token}/${req.body.userId}/approved">
        ${process.env.APP_URL}/purchase/update-approval-status/${token}/${req.body.userId}/approved
        </a><br/>
        <strong>Or</strong> <br/>
        DECLINE: <a href="${process.env.APP_URL}/purchase/update-approval-status/${token}/${req.body.userId}/declined">
        ${process.env.APP_URL}/purchase/update-approval-status/${token}/${req.body.userId}/declined</a>`
    // If a buyer is related to a cooperative and the order is being payed in installment,
    // send the cooperative-admin an email to accepted or decline order
    if (buyer.cooperative) {
      // generate a token for status update
      const cooperativeMessage = `<div>
        Hello ${buyer.cooperative.lastName || ','} a member of your cooperative on ${process.env.APP_NAME} just
        made a purchase below is the order details
        <p>Order Number <strong>#${order.orderNumber}</strong></p>
        ${orderDetails}
        <p>
        ${orderAction}
        </p>
        </div>`

      sendMail(buyer.cooperative.email, subject, cooperativeMessage, (mailErr, mailRes) => {
        if (mailErr) req.log(`${subject} MAIL not sent to ${buyer.cooperative.email}`)
        if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
      }, `${process.env.MAIL_FROM}`)
    }

    if (adminEmails.length) {
      const adminMessage = `<div>
        Hi admin, ${buyer.lastName} ${buyer.firstName} just made a purchase below is the order details
        <p>Order Number <strong>#${order.orderNumber}</strong></p>
        ${orderDetails}
        <p>
        ${orderAction}
        </p>
        </div>`

      sendMail(adminEmails, subject, adminMessage, (mailErr, mailRes) => {
        if (mailErr) req.log(`${subject} MAIL not sent to ${buyer.email()}`)
        if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
      }, `${process.env.MAIL_FROM}`)
    }

    // If the order isn't paid for partly notify the seller of the new order
    if (product.seller && req.body.instNumber === 1) {
      const sellerMessage = `<div>
        Hi ${product.seller.lastName} ${product.seller.firstName}, you have a new Order on ${process.env.APP_NAME}
        below is the order details
        <p>Order Number <strong>#${order.orderNumber}</strong></p>
        ${orderDetails}
        <p>Login to take action</p>
        </div>`

      sendMail(product.seller.email, subject, sellerMessage, (mailErr, mailRes) => {
        if (mailErr) req.log(`${subject} MAIL not sent to ${buyer.email()}`)
        if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
      }, `${process.env.MAIL_FROM}`)
    }
  } catch (e) {
    req.log(`Could not send email for New Order ::: ${e.message}`)
  }
}

const removeFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) {
      // log error
    }
  })
}


module.exports = {
  sendMail,
  sendWelcomeMail,
  removeFile,
  sendPasswordResetEmail,
  sendOrderNewOrderMail,
  constants,
}