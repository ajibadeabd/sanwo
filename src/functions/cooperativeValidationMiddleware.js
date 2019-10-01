const Validator = require('./../functions/Validator')

const profileUpdate = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body }

  const validationRule = {
    firstName: 'sometimes|required',
    lastName: 'sometimes|required',
    phoneNumber: 'sometimes|digits:10|exists:User,phoneNumber',
    old_password: 'sometimes|password_policy',
    password: 'sometimes|password_policy|confirmed',
    password_confirmation: 'sometimes|password_policy'
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

const memberTransactions = (req, res, next) => {
  const validationRule = {
    memberId: 'required|mongoId|exists:User,_id'
  }

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

const memberStatus = (req, res, next) => {
  const validationRule = {
    memberId: 'required|mongoId|exists:User,_id',
    status: 'required|valid_status',
  }

  Validator({ ...req.params, ...req.body }, validationRule, {}, (err, status) => {
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
  profileUpdate,
  memberTransactions,
  memberStatus
}
