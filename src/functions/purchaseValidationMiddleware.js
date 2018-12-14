const Validator = require('./../functions/Validator')

const create = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body }

  const validationRule = {
    product: 'required|mongoId',
    quantity: 'required|numeric|min:1',
    instNumber: 'numeric'
  }

  Validator(requestBody, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    } else {
      next()
    }
  })
}

const updateApprovalStatus = (req, res, next) => {
  const validationRule = {
    token: 'required',
    adminId: 'required|mongoId',
    status: 'required|valid_order_status'
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

const updateOrderStatus = (req, res, next) => {
  const validationRule = {
    orderId: 'required|mongoId',
    status: 'required|valid_order_status'
  }

  Validator(req.body, validationRule, {}, (err, status) => {
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
  create,
  updateApprovalStatus,
  updateOrderStatus
}