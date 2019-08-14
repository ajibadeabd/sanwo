const Validator = require('./../functions/Validator')

const update = (req, res, next) => {
  const validationRule = {
    purchaseId: 'mongoId|exists:Purchase,_id',
    status: 'valid_order_status',
    trackingDetails: 'string',
  }

  Validator({ ...req.body, ...req.params }, validationRule, {}, (err, status) => {
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

const get = (req, res, next) => {
  const validationRule = {
    startDate: 'date',
    endDate: 'date'
  }

  Validator(req.query, validationRule, {}, (err, status) => {
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
  get,
  update
}
