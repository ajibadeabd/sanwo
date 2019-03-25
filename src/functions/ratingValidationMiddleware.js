const Validator = require('./../functions/Validator')

const get = (req, res, next) => {
  const validationRule = {
    _id: 'mongoId',
    product: 'mongoId',
    user: 'mongoId'
  }

  Validator(req.query, validationRule, {}, (err, status) => {
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

const create = (req, res, next) => {
  const validationRule = {
    product: 'required|exists:Inventory,_id',
    rating: 'required|numeric|min:1|max:5',
    review: 'string'
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
  const validationRule = { id: 'required|mongoId|exists:Rating,_id' }
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
