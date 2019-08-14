const Validator = require('./../functions/Validator')

const generateOrderPaymentRRR = (req, res, next) => {
  const validationRule = {
    orderNumber: 'required|numeric|min:1',
  }

  Validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      return res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    }
    next()
  })
}

const getOrderPayments = (req, res, next) => {
  const validationRule = {
    orderNumber: 'required|numeric|min:1',
  }

  Validator(req.params, validationRule, {}, (err, status) => {
    if (!status) {
      return res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    }
    next()
  })
}

const getPayment = (req, res, next) => {
  const validationRule = { paymentId: 'required|mongoId|exists:Payment,_id' }

  Validator(req.params, validationRule, {}, (err, status) => {
    if (!status) {
      return res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    }
    next()
  })
}

const installmentMandateStatus = (req, res, next) => {
  const validationRule = {
    orderId: 'required|mongoId|exists:Order,_id'
  }

  Validator(req.params, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation Failed',
          data: err
        })
    } else {
      next()
    }
  })
}

module.exports = {
  generateOrderPaymentRRR,
  getOrderPayments,
  getPayment,
  installmentMandateStatus
}
