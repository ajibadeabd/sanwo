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
        <a href=${process.env.WEB_URL}/password?type=set&token=${resetPasswordToken}>
        ${process.env.WEB_URL}/password?type=set&token=${resetPasswordToken}
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


module.exports = {
  sendMail,
  sendWelcomeMail,
  sendPasswordResetEmail,
}
