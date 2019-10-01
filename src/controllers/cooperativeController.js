/* eslint-disable no-shadow */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const bcrypt = require('bcrypt')
const { queryFilters } = require('../../utils/helper-functions')
const { constants } = require('../../utils/helpers')
const notificationEvents = require('../../utils/notificationEvents')

const update = async (req, res) => {
  try {
    const userExist = await req.Models.User.findOne({ _id: req.body.userId })

    if (!userExist) {
      return res.status(400)
        .send({
          success: false,
          message: 'Could not find user',
          data: null
        })
    }

    if (req.body.password && (!bcrypt.compareSync(req.body.password, userExist.password))) {
      return res.status(400)
        .send({
          success: false,
          message: 'Old password is incorrect',
          data: null
        })
    }

    if (req.body && req.body.firstName) {
      userExist.name = `${req.body.firstName} ${req.body.lastName}`
      userExist.firstName = req.body.firstName || ''
      userExist.lastName = req.body.lastName || ''
    }

    if (req.body && req.body.password_confirmation) {
    //   userExist.password = await bcrypt.hash(req.body.password, 10)
      userExist.password = req.body.password_confirmation
    }

    if (req.body && req.body.phone) {
      userExist.phoneNumber = req.body.phone
    }

    const updatedUser = await userExist.save()
    res.send({
      success: true,
      message: 'Updated successfully',
      data: updatedUser,
      token: req.headers['x-access-token']
    })
  } catch (error) {
    return res.status(400)
      .send({
        success: false,
        message: error.message,
        data: null
      })
  }
}

const members = async (req, res) => {
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10
  const filter = queryFilters(req)
  filter.cooperative = req.authData.userId
  const model = req.Models.User.find(filter)
  const resultCount = await req.Models.User.countDocuments(filter)
  model.select('-password')
  model.skip(offset)
  model.limit(limit)
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching members',
        data: {
          offset,
          limit,
          resultCount,
          results
        }
      })
    }
  })
}

const cooperativePaymentReminder = async (req, res) => {
  const { amount } = req.body
  const user = await req.Models.User.findById(req.params.memberId)

  // send mesaage to defaulting member.
  notificationEvents.emit('cooperative_member_payment_reminder', { user, amount })
  res.send({
    success: true,
    message: 'Successfully notified the defaulting member.',
    data: user
  })
}

const cooperativeMemberOrders = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit, 10)
    let offset = parseInt(req.query.offset, 10)
    offset = offset || 0
    limit = limit || 10
    const filter = queryFilters(req)
    const model = req.Models.Order.find(filter)
      .populate(
        {
          path: 'buyer',
          // select: 'cooperative',
          match: { cooperative: req.authData.userId }
        }
      )
      .populate({
        path: 'purchases',
        populate: { path: 'category' }
      })
      .populate('buyer')
    model.select('-password')
    model.skip(offset)
    model.limit(limit)
    model.sort({ createdAt: 'desc' })
    const results = await model
    const resultCount = await model.countDocuments(filter)

    res.send({
      success: true,
      message: 'Successfully fetching members',
      data: {
        offset,
        limit,
        resultCount,
        results
      }
    })
  } catch (err) {
    res.status(500).send({
      success: false,
      message: 'Oops! an error occurred.',
      data: {}
    })
    throw err
  }
}

const defaultingMembers = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit, 10)
    let offset = parseInt(req.query.offset, 10)
    offset = offset || 0
    limit = limit || 10
    const corperativeIds = []
    const corpertiveMembers = await req.Models.User.find({ cooperative: req.authData.userId })
      .skip(offset)
      .limit(limit)
    for (const member of corpertiveMembers) {
      corperativeIds.push(member._id)
    }
    const members = JSON.parse(JSON.stringify(corpertiveMembers))

    for (const mem of members) {
      mem.totalMoneyOwed = 0
      const orders = await req.Models.Order.find({ buyer: mem._id, installmentPaymentStatus: 'pending', installmentPeriod: { $ne: null } }).select({ subTotal: 1 })
      for (const order of orders) {
        mem.totalMoneyOwed += order.subTotal
      }
    }
    const result = members.filter(e => e.totalMoneyOwed !== 0)
    const resultCount = result.length
    res.send({
      success: true,
      message: 'Successfully fetching defaulting members',
      data: {
        resultCount,
        results: result
      }
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Oops! an error occurred.',
      data: {}
    })
    throw error
  }
}

// Get all the order, purchases, and payment record for this user
const memberTransactions = async (req, res) => {
  const { memberId } = req.params

  try {
    let limit = parseInt(req.query.limit, 10)
    let offset = parseInt(req.query.offset, 10)
    offset = offset || 0
    limit = limit || 10
    const filter = queryFilters(req)
    filter.buyer = memberId
    const model = req.Models.Order.find(filter)
      .populate(
        {
          path: 'buyer',
          // select: 'cooperative',
          match: { cooperative: req.authData.userId }
        }
      )
      .populate('purchases')
      .populate('approvalStatusChangedBy')
      .populate('payment')
    model.select('-password')
    model.skip(offset)
    model.limit(limit)
    model.sort({ createdAt: 'desc' })
    const results = await model
    const resultCount = await model.countDocuments(filter)

    res.send({
      success: true,
      message: 'Successfully fetching defaulting members',
      data: {
        offset,
        limit,
        resultCount,
        results
      }
    })
  } catch (err) {
    res.status(500).send({
      success: false,
      message: 'Oops! an error occurred.',
      data: {}
    })
    throw err
  }
}

const updateMemberStatus = async (req, res) => {
  const { accepted, declined } = constants.ACCOUNT_STATUS
  if (req.body.status !== accepted && req.body.status !== declined) {
    return res.status(400)
      .send({
        status: false,
        message: 'Validation failed',
        data: {
          errors: { status: ['The status can be either accepted or declined.'] }
        }
      })
  }
  const user = await req.Models.User.findById(req.params.memberId)

  // Check if the user belongs to this current users cooperative
  if (user.cooperative.toString() !== req.authData.userId) {
    return res.status(400)
      .send({
        status: false,
        message: 'Validation failed',
        data: {
          errors: { status: ['This user doesn\'t belong to your co-operative.'] }
        }
      })
  }
  const { status } = req.body
  user.status = status
  user.save()

  res.send({
    success: true,
    message: 'Successfully updated member status, member has been notified.',
    data: user
  })
  notificationEvents.emit('cooperative_member_status_updated', { user, status })
}


module.exports = {
  update,
  members,
  cooperativeMemberOrders,
  defaultingMembers,
  memberTransactions,
  updateMemberStatus,
  cooperativePaymentReminder
}
