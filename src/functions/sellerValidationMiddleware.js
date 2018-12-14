const Validator = require('./../functions/Validator')

const profileUpdate = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body }

  const validationRule = {
    firstName: 'sometimes|required',
    lastName: 'sometimes|required',
    email: 'sometimes|email|exists:User,email',
    businessAddress: 'sometimes|required'
  }

  Validator(requestBody, validationRule, {}, (err, status) => {
    if (!status) {
      res.send({
        success: false,
        message: 'Validation failed',
        data: err
      })
        .status(400)
    } else {
      next()
    }
  })
}

module.exports = {
  profileUpdate
}