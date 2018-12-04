const fs = require('fs');
const nodemailer = require('nodemailer');

const constants = {
    STATUS: {
      delivered: 'delivered',
      created: 'created',
      payment: 'payment'
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

    const sendOrderMail = (seller, req) => {
        const { lastName, email } = seller
        const messageBody = `<p>Hello ${lastName}. An Order Has been made for an item successfully</p>`
        const subject = `${process.env.APP_NAME}: Order Made`
        sendMail(email, subject, messageBody, (mailErr, mailRes) => {
          if (mailErr) {
            req.log('MAIL not sent')
          }
          if (mailRes) req.log('Message sent: %s', mailRes.messageId)
        }, `${process.env.MAIL_FROM}`)
      }

        const deliverMail = (seller, req) => {
            const { lastName, email } = seller
            const messageBody = `<p>Hello ${lastName}. The item has been delivered to the buyer Successfully</p>`
            const subject = `${process.env.APP_NAME}: Order Delivered!`
            sendMail(email, subject, messageBody, (mailErr, mailRes) => {
            if (mailErr) {
                req.log('MAIL not sent')
            }
            if (mailRes) req.log('Message sent: %s', mailRes.messageId)
            }, `${process.env.MAIL_FROM}`)
        }
      
        const PaymentMail = (seller, req) => {
            const { lastName, email } = seller
            const messageBody = `<p>Hello ${lastName}. Payment has been successfully made to your wallet!!</p>`
            const subject = `${process.env.APP_NAME}: Payment Received!!`
            sendMail(email, subject, messageBody, (mailErr, mailRes) => {
            if (mailErr) {
                req.log('MAIL not sent')
            }
            if (mailRes) req.log('Message sent: %s', mailRes.messageId)
            }, `${process.env.MAIL_FROM}`)
        }

module.exports = {
    sendMail,
    sendOrderMail,
    deliverMail,
    PaymentMail
}