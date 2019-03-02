const Validator = require('./../functions/Validator')

const get = (req, res, next) => {
  const validationRule = {
    _id: 'mongoId',
    bankName: 'string',
    accountNumber: 'string',
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
    bankName: 'required',
    accountName: 'required',
    accountNumber: 'required|exists:BankAccount,accountNumber',
    bankCode: 'required|min:3'
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

const update = (req, res, next) => {
  const reqBody = { ...req.body, ...req.params }

  const validationRule = {
    bankAccountId: 'required|mongoId|exists:BankAccount,_id',
    bankName: 'string',
    accountName: 'string',
    accountNumber: 'string',
    bankCode: 'string|min:3',
  }

  Validator(reqBody, validationRule, {}, (err, status) => {
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
  const validationRule = { bankAccountId: 'required|mongoId|exists:BankAccount,_id' }
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
  update,
  destroy
}
