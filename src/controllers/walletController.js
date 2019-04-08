/* eslint-disable camelcase */
const moment = require('moment')
const { queryFilters } = require('../../utils/helper-functions')
const models = require('../models')
const helpers = require('../../utils/helpers')
const notificationEvents = require('../../utils/notificationEvents')

const createWalletRecord = async (record) => {
  try {
    const wallet = await models.Wallet.create(record)
    return Promise.resolve(wallet)
  } catch (error) {
    return Promise.reject(error)
  }
}

const statistics = async (req, res) => {
  const query = req.Models.Wallet
    .find({ seller: req.body.userId })

  const {
    withdrawal_in_progress,
    payment_confirmed,
    payment_withdrawal_successful,
    reversed_payment
  } = helpers.constants.WALLET_STATUS

  let paymentConfirmed = await query
    .where('status', payment_confirmed)
    .select('amount')
  paymentConfirmed = paymentConfirmed.reduce((acc, current) => acc + current.amount, 0)


  let withdrawalInProgress = await query
    .where('status', withdrawal_in_progress)
    .select('amount')
  withdrawalInProgress = withdrawalInProgress.reduce((acc, current) => acc + current.amount, 0)

  let paymentWithdrawalSuccessful = await query
    .where('status', payment_withdrawal_successful)
    .select('amount')
  paymentWithdrawalSuccessful = paymentWithdrawalSuccessful
    .reduce((acc, current) => acc + current.amount, 0)

  let reversedPayment = await query
    .where('status', reversed_payment)
    .select('amount')
  reversedPayment = reversedPayment.reduce((acc, current) => acc + current.amount, 0)


  res.send({
    success: true,
    message: 'Successfully fetching wallet record',
    data: {
      paymentConfirmed,
      withdrawalInProgress,
      paymentWithdrawalSuccessful,
      reversedPayment
    }
  })
}

const getWallet = (req, res) => {
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10

  let filter = { seller: req.body.userId }
  filter = { ...filter, ...queryFilters(req) }
  // const select = 'email firstName lastName email'
  const query = req.Models.Wallet.find(filter)
  // filter by date if any
  if (req.query.startDate && req.query.endDate) {
    const startDate = moment(new Date(req.query.startDate)).format()
    const endDate = moment(new Date(req.query.endDate)).add(1, 'day').format()
    query.where({ createdAt: { $gt: startDate, $lt: endDate } })
  }
  query.populate('order')
  query.skip(offset)
  query.limit(limit)
  query.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching wallet record',
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

const requestWithdrawal = async (req, res) => {
  // seller should not be able request withdrawal when purchase status is not confirmed
  const select = 'email firstName lastName email'
  const wallet = await req.Models.Wallet
    .findOne({ _id: req.body.walletId, seller: req.body.userId })
    .populate('seller', select)
    .populate('purchase')

  if (wallet.purchase.status !== helpers.constants.ORDER_STATUS.confirmed) {
    return res.status(403).send({
      success: false,
      message: 'The purchase has not been confirmed by the buyer',
      data: []
    })
  }
  //
  const { withdrawal_in_progress, payment_withdrawal_successful } = helpers.constants.WALLET_STATUS
  //
  if (wallet.status === withdrawal_in_progress) {
    return res.status(403).send({
      success: false,
      message: 'Previous withdrawal request for this transaction is still progress',
      data: []
    })
  }

  if (wallet.status === payment_withdrawal_successful) {
    return res.status(403).send({
      success: false,
      message: 'Previous withdrawal request for this transaction was successful',
      data: []
    })
  }

  wallet.status = withdrawal_in_progress
  wallet.save()

  // send withdrawal status notification
  notificationEvents.emit('wallet_status_changed',
    { wallet }, withdrawal_in_progress.replace(/_/g, ' ').toUpperCase())

  return res.send({
    success: true,
    message: 'Withdrawal initiated successfully',
    data: wallet
  })
}

module.exports = {
  createWalletRecord,
  getWallet,
  requestWithdrawal,
  statistics
}
