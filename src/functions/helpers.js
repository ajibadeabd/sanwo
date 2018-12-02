const fs = require('fs')
const nodemailer = require('nodemailer')


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
  constants
}