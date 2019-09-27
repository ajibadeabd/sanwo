const bcrypt = require('bcrypt')

const utils = require('../../utils/helper-functions')
const { constants } = require('../../utils/helpers')
const userService = require('../services/user.service')
const notificationEvents = require('../../utils/notificationEvents')

const updateAccountStatus = async (req, res) => {
  try {
    const user = await userService.update(req.params.userId, { status: req.body.status })
    // TODO notify use of account status change
    return res.send({
      success: true,
      message: 'Account status updated',
      data: user,
    })
  } catch (e) {
    res.status(500).send({
      success: false,
      message: 'Oops! an error occurred. Please retry, if error persist contact admin',
    })
    throw new Error(e)
  }
}

const getUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10
    const offset = parseInt(req.query.offset, 10) || 0
    let filter = utils.queryFilters(req)
    // check if filter includes name query
    if (Object.keys(filter).includes('name')) {
      const { name } = filter
      const query = { $regex: name, $options: 'i' }
      filter = { ...filter, $or: [{ firstName: query }, { lastName: query }] }
      delete filter.name
    }

    const { results, resultCount } = await userService.get(filter, offset, limit)
    res.send({
      success: true,
      message: 'Successfully fetching users',
      data: {
        offset, limit, resultCount, results
      }
    })
  } catch (e) {
    res.status(500).send({
      success: false,
      message: 'Oops! an error occurred. Please retry, if error persist contact admin',
    })
    throw new Error(e)
  }
}

const profileUpdate = async (req, res) => {
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

    // if (req.body && req.body.password) {
    //   userExist.password = await bcrypt.hash(req.body.password, 10)
    // }
    userExist.password = req.body.password_confirmation
    userExist.phoneNumber = req.body.phone
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

const updateInventoryStatus = async (req, res) => {
  const product = await req.Models.Inventory.findById(req.params.product)
  product.status = req.body.status
  product.save()
  res.send({ success: true, message: 'Inventory status updated', data: product })
  notificationEvents.emit('inventory_status_changed', { product })
}

const getUserStatistics = async (req, res) => {
  const filter = { deletedAt: undefined }
  const sellers = await req.Models.User
    .countDocuments({ accountType: constants.SELLER, ...filter })

  const buyers = await req.Models.User
    .countDocuments({ accountType: constants.BUYER, ...filter })

  const cooperatives = await req.Models.User
    .countDocuments({ accountType: constants.CORPORATE_ADMIN, ...filter })

  const administrators = await req.Models.User
    .countDocuments({ accountType: constants.SUPER_ADMIN, ...filter })

  return res.send({
    success: true,
    message: 'Successfully fetching stats',
    data: {
      sellers,
      buyers,
      cooperatives,
      administrators
    }
  })
}

const deleteAccount = async (req, res) => {
  try {
    await userService.destroy(req.params.userId, req.body.userId)
    return res.send({
      success: true,
      message: 'Account deleted successfully',
      data: {},
    })
  } catch (e) {
    res.status(500).send({
      success: false,
      message: 'Oops! an error occurred. Please retry, if error persist contact admin',
    })
    throw new Error(e)
  }
}

module.exports = {
  updateAccountStatus,
  getUsers,
  profileUpdate,
  updateInventoryStatus,
  getUserStatistics,
  deleteAccount
}
