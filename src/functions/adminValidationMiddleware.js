const Validator = require('./../functions/Validator')

const updateAccountStatusValidation = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body }

  const validationRule = {
    userId: 'required|mongoId|exists:User,_id',
    status: 'required|valid_status'
  }

  Validator(requestBody, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400).send({
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
  updateAccountStatusValidation
}