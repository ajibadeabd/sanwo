const Validator = require('./../functions/Validator')

const updateAccountStatusValidation = (req, res, next) => {
  const requestBody = { ...req.params, status: req.body.status }

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

const deleteAccount = (req, res, next) => {
  const requestBody = { ...req.params }

  const validationRule = {
    userId: 'required|mongoId|exists:User,_id',
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

const updateInventoryStatus = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body }

  const validationRule = {
    product: 'required|mongoId|exists:Inventory,_id',
    status: 'required|boolean'
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

const profileUpdate = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body }

  const validationRule = {
    name: 'sometimes|required',
    email: 'sometimes|email|exists:User,email',
    password: 'sometimes|password_policy|confirmed',
    old_password: 'required_with:password'
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
  updateAccountStatusValidation,
  profileUpdate,
  updateInventoryStatus,
  deleteAccount
}
