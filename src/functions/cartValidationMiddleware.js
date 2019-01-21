const Validator = require('./../functions/Validator')

const create = (req, res, next) => {
  const validationRule = {
    product: 'required|mongoId|exists:Inventory,_id',
    quantity: 'required|numeric|min:1',
    installmentPeriod: 'numeric|min:2',
  }

  Validator(req.body, validationRule, {}, (err, status) => {
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

const get = (req, res, next) => {
  const validationRule = {
    _id: 'mongoId',
    name: 'string',
    installmentPeriod: 'numeric|min:2',
  }

  Validator(req.body, validationRule, {}, (err, status) => {
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


const destroy = (req, res, next) => {
  const validationRule = { cart: 'required|mongoId|exists:Cart,_id' }
  Validator(req.params, validationRule, {}, (err, status) => {
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

module.exports = {
  get,
  create,
  destroy
}
