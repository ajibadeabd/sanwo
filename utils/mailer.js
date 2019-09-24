const nodemailer = require('nodemailer')
// TODO:: use proper email template for these mails

const sendMail = (to, subject, mailBody, callback, from = null) => {
  const mailOptions = {
    from: from || process.env.MAIL_FROM, // sender address
    sender: process.env.APP_NAME, // sender address
    to, // list of receivers
    subject, // Subject line
    html: mailBody // html body
  }

  const transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 10,
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
  const messageBody = `
  <div>
    <p>Hello ${lastName} </p>
    <p>we are happy to have you at ${process.env.APP_NAME}</p>
    <p>Follow this link to learn more about us<br/><a href="${process.env.WEB_URL}/"
>Learn more</a></p>
    <a>${process.env.WEB_URL}</a>
</div>
`
  const subject = `Welcome to ${process.env.APP_NAME}`

  sendMail(email, subject, messageBody, (mailErr, mailRes) => {
    if (mailErr) {
      req.log('MAIL not sent')
    }
    if (mailRes) req.log('Message sent: %s', mailRes.messageId)
  }, `${process.env.MAIL_FROM}`)
}

const orderShipped = (order, req) => {
  const { lastName, email } = order.buyer
  const messageBody = `
  <div>
    <p>Hello ${lastName},
    We are happy to inform you that your order from ${process.env.APP_NAME} has been shipped.</p>
    <h3>Order Details</h3>
    <ul>
        <li>Order Number: ${order.orderNumber}</li>
        <li>Order Quantity: ${order.totalQuantities}</li>
        <li>Order Cost: ₦ ${order.subTotal}</li>
    </ul>
    <p>Thanks.</p>
  </div>
  `
  const subject = `Shipped Order ${order.orderNumber}`

  sendMail(email, subject, messageBody, (mailErr, mailRes) => {
    if (mailErr) {
      req.log('MAIL not sent', mailErr)
    }
    if (mailRes) req.log('Message sent: %s', mailRes.messageId)
  }, `${process.env.MAIL_FROM}`)
}

const orderDelivered = (order, req) => {
  const { lastName, email, firstName } = order.buyer
  const messageBody = `
  <div>
    <p>Your order for ${lastName} ${firstName} has been delivered</p>
    <h3>Order Details</h3>
    <ul>
        <li>Order Number: ${order.orderNumber}</li>
        <li>Order Quantity: ${order.totalQuantities}</li>
        <li>Order Cost: ₦ ${order.subTotal}</li>
    </ul>
    <p></p>
  </div>
  `
  const subject = `Delivered Order ${order.orderNumber}`

  sendMail(email, subject, messageBody, (mailErr, mailRes) => {
    if (mailErr) {
      req.log('MAIL not sent', mailErr)
    }
    if (mailRes) req.log('Message sent: %s', mailRes.messageId)
  }, `${process.env.MAIL_FROM}`)
}


module.exports = {
  sendMail,
  orderShipped,
  orderDelivered,
  sendWelcomeMail
}
