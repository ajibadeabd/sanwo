const Validator = require('./../functions/Validator')

const getWallet = (req, res, next) => {
  const validationRule = {
    _id: 'mongoId',
    startDate: 'date',
    endDate: 'date'
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

const requestWithdrawal = (req, res, next) => {
  const reqBody = { ...req.body, ...req.params }

  const validationRule = {
    bankAccountId: 'required|mongoId|exists:BankAccount,_id',
    walletId: 'required|mongoId|exists:Wallet,_id',
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

module.exports = {
  getWallet,
  requestWithdrawal
}
