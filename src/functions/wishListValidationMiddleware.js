const Validator = require('./../functions/Validator')

const create = (req, res, next) => {
  const validationRule = {
    product: 'required|mongoId|exists:Inventory,_id',
    description: 'string',
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

const deleteWishList = (req, res, next) => {
  const validationRule = { id: 'required|mongoId|exists:WishList,_id' }
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
  create,
  deleteWishList
}
