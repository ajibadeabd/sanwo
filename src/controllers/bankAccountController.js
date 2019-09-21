const { queryFilters } = require('../../utils/helper-functions')

const createBankAccount = (req, res) => {
  req.Models.BankAccount.create({
    user: req.body.userId,
    bankName: req.body.bankName,
    accountName: req.body.accountName,
    accountNumber: req.body.accountNumber,
    bankCode: req.body.bankCode,
  }, (err, result) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Created Successfully',
        data: result
      }).status(201)
    }
  })
}

const getBankAccounts = (req, res) => {
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10
  let filter = queryFilters(req)
  filter = { ...filter, user: req.body.userId }
  const model = req.Models.BankAccount.find(filter)
  model.skip(offset)
  model.limit(limit)
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching bank accounts',
        data: {
          offset,
          limit,
          resultCount: results.length,
          results
        }
      })
    }
  })
}

const updateBankAccount = (req, res) => {
  req.Models.BankAccount.findOne({ _id: req.params.bankAccountId })
    .exec((err, bankAccount) => {
      if (err) {
        throw err
      } else if (bankAccount) {
        bankAccount.bankName = req.body.bankName || bankAccount.bankName
        bankAccount.accountName = req.body.accountName || bankAccount.accountName
        bankAccount.accountNumber = req.body.accountNumber || bankAccount.accountNumber
        bankAccount.bankCode = req.body.bankCode || bankAccount.bankCode

        bankAccount.save((error) => {
          if (error) throw error
          return res.send({
            success: true,
            message: 'Updated Successfully',
            data: bankAccount
          })
        })
      } else {
        return res.send({
          success: true,
          message: 'This record is not associated with your account',
          data: bankAccount
        }).status(403)
      }
    })
}

// a user can't delete bank account for now
const destroyBankAccount = (req, res) => {
  req.Models.BankAccount.findByIdAndDelete(
    req.params.bankAccountId, (err, bankAccount) => {
      if (err) throw err
      else {
        res.send({
          status: true,
          message: 'Deleted successfully',
          data: bankAccount
        })
      }
    }
  )
}

module.exports = {
  createBankAccount,
  getBankAccounts,
  updateBankAccount,
  destroyBankAccount
}
