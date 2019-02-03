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


const sendWelcomeMail = async (user, req) => {
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

const sendNewOrderMail = async (order, req) => {
  // get the buyers detail
  const buyerId = order.buyer
  const buyer = await req.Models.User.findOne({ _id: buyerId })
    .populate('cooperative')

  const subject = `${process.env.APP_NAME}: New Order`
  const sellers = []

  // create a list of purchased products
  const { cart } = order
  let productDetails = '<table border="1">'
  productDetails += '<tr>'
    + '<th>Product Name</th>'
    + '<th>Quantity</th>'
    + '<th>Unit Price</th>'
    + '<th>Unit Subtotal</th></tr>'
  if (cart.length) {
    for (let i = 0; i < cart.length; i += 1) {
      // get seller details
      sellers.push(cart[i].product.seller)
      productDetails += `<tr>
<td>${cart[i].product.name}</td>
<td>${cart[i].quantity}</td>
<td>${cart[i].unitPrice}</td>
<td>${cart[i].subTotal}</td>
</tr>`
    }
  }
  productDetails += '</table>'
  // create the order details and append the order list
  const orderDetails = `<h3>Order Details</h3>
        <table border="1">
        <tr><th>Order Number</th><td>#${order.orderNumber}</td></tr>
        <tr><th>Total Product</th><td>${order.totalProduct}</td></tr>
        <tr><th>Total Quantities</th><td>${order.totalQuantities}</td></tr>
        <tr><th>Product Details</th><td>${productDetails}</td></tr>
        <tr><th>Subtotal</th><td>${order.subTotal}</td></tr>
        </table>`
  // compose the message for buyer
  const buyerMessage = `<div>
        Hello ${buyer.lastName || ','} thank you for using ${process.env.APP_NAME} <br/>
        <p>Your order number <strong>#${order.orderNumber}</strong> is currently
        <strong>PENDING</strong> you'll be notified of the status once processed</p>
        ${orderDetails}
        </div>`

  // send buyer email
  sendMail(buyer.email, subject, buyerMessage, (mailErr, mailRes) => {
    if (mailErr) req.log(`${subject} MAIL not sent to ${buyer.email}`)
    if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
  }, `${process.env.MAIL_FROM}`)

  if (sellers.length) {
    // TODO:: Only send product that belongs to the seller i.e group sellers product
    for (let sIndex = 0; sIndex < sellers.length; sIndex += 1) {
      // compose the seller mail
      const sellerMessage = `<div>
        Hi ${sellers[sIndex].lastName}
${sellers[sIndex].firstName}, you have a new Order on ${process.env.APP_NAME}
        below are the order details
        <p>Order Number <strong>#${order.orderNumber}</strong></p>
        ${orderDetails}
        <p><a href="#"><strong>Login to take action</strong></a></p>
        </div>`
      // send mail for each item seller
      sendMail(sellers[sIndex].email, subject, sellerMessage,
        (mailErr, mailRes) => {
          if (mailErr) req.log(`${subject} MAIL not sent to ${buyer.email}`)
          if (mailRes) req.log(`Preview URL: %s ${nodemailer.getTestMessageUrl(mailRes)}`)
        }, `${process.env.MAIL_FROM}`)
    }
  }
}

const sendInstallmentOrderApprovalMail = async (approvalToken, order, req) => {
  // get all admin emails
  let adminEmails = await req.Models.User.find({ accountType: 'super_admin' })
    .select('-_id email')
  adminEmails = adminEmails.map(adminUser => adminUser.email)

  // get buyer details
  const buyerId = order.buyer
  const buyer = await req.Models.User.findOne({ _id: buyerId })
    .populate('cooperative')

  const subject = `${process.env.APP_NAME}: New Order`

  const { cart, installmentsRepaymentSchedule } = order
  let productDetails = '<table border="1">'
  productDetails += '<tr>'
    + '<th>Product Name</th>'
    + '<th>Quantity</th>'
    + '<th>Unit Price</th>'
    + '<th>Unit Subtotal</th></tr>'
  if (cart.length) {
    for (let i = 0; i < cart.length; i += 1) {
      productDetails += `<tr>
  <td>${cart[i].product.name}</td>
  <td>${cart[i].quantity}</td>
  <td>${cart[i].unitPrice}</td>
  <td>${cart[i].subTotal}</td>
  </tr>`
    }
  }
  productDetails += '</table>'

  let repaymentDetails = '<table border="1">'
  repaymentDetails += '<tr>'
    + '<th>Installment Ref</th>'
    + '<th>Installment Percentage</th>'
    + '<th>Installment Amount</th>'
    + '<th>Installment Due Date</th>'
    + '</tr>'
  if (installmentsRepaymentSchedule.length) {
    for (let i = 0; i < installmentsRepaymentSchedule.length; i += 1) {
      repaymentDetails += `<tr>
<td>${installmentsRepaymentSchedule[i].installmentRef}</td>
<td>${installmentsRepaymentSchedule[i].installmentPercentage}%</td>
<td>${installmentsRepaymentSchedule[i].amount}</td>
<td>${installmentsRepaymentSchedule[i].dueDate}</td>
</tr>`
    }
  }
  repaymentDetails += '</table>'

  // create the order details and append the order list
  const orderDetails = `<h3>Order Details</h3>
        <table border="1">
        <tr><th>Order Number</th><td>#${order.orderNumber}</td></tr>
        <tr><th>Product Details</th><td>${productDetails}</td></tr>
        <tr><th>Total Product</th><td>${order.totalProduct}</td></tr>
        <tr><th>Total Quantities</th><td>${order.totalQuantities}</td></tr>
        <tr><th>Subtotal</th><td>${order.subTotal}</td></tr>
        <tr><th>Installment Period</th><td>${order.installmentPeriod}</td></tr>
        <tr><th>Installment Percentage</th><td>${order.installmentPercentage}%</td></tr>
        <tr><th>Repayment Details</th><td>${repaymentDetails}</td></tr>
        <tr><th>Installment Total</th><td>${order.installmentTotalRepayment}</td></tr>
        </table>`

  // create item details
  const orderAction = `Your action is needed for this order
        APPROVE : <a href="${process.env.APP_URL}/order/update-approval-status/${approvalToken}/${req.body.userId}/approved">
        ${process.env.APP_URL}/order/update-approval-status/${approvalToken}/${req.body.userId}/approved
        </a><br/>
        <strong>Or</strong> <br/>
        DECLINE: <a href="${process.env.APP_URL}/order/update-approval-status/${approvalToken}/${req.body.userId}/declined">
        ${process.env.APP_URL}/order/update-approval-status/${approvalToken}/${req.body.userId}/declined</a>`

  // send the cooperative-admin an email to accepted or decline order
  if (buyer.cooperative) {
    const cooperativeMessage = `<div>
        Hello ${buyer.cooperative.lastName || ','} a member of your cooperative on ${process.env.APP_NAME} just
        made a purchase below are the order details
        <p>Customer Name <strong>${buyer.firstName} ${buyer.lastName}</strong></p>
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
        Hi admin, ${buyer.lastName} ${buyer.firstName} just made a purchase below are the order details
        <p>Order Number <strong>#${order.orderNumber}</strong></p>
        ${orderDetails}
        <p>
        ${orderAction}
        </p>
        </div>`

    sendMail(adminEmails, subject, adminMessage, (mailErr, mailRes) => {
      if (mailErr) req.log(`${subject} MAIL not sent to ${buyer.email}`)
      if (mailRes) req.log(`Preview URL: Admin %s ${nodemailer.getTestMessageUrl(mailRes)}`)
    }, `${process.env.MAIL_FROM}`)
  }
}

module.exports = {
  sendMail,
  sendWelcomeMail,
  sendPasswordResetEmail,
  sendNewOrderMail,
  sendInstallmentOrderApprovalMail
}
