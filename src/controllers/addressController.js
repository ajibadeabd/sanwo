const utils = require('../../utils/helper-functions')
const addressService = require('../services/address.service')

const create = async (req, res) => {
  try {
    const currentUser = await req.Models.User.findOne({ _id: req.body.userId })
    const result = await addressService.create({
      user: currentUser._id,
      firstName: req.body.firstName || currentUser.firstName,
      lastName: req.body.lastName || currentUser.lastName,
      phoneNumber: req.body.phoneNumber || currentUser.phoneNumber,
      address: req.body.address,
      additionalInfo: req.body.additionalInfo,
      state: req.body.state,
      city: req.body.city,
      country: req.body.country,
      zip: req.body.zip
    })
    res.send({ success: true, message: 'Address Created Successfully', data: result })
  } catch (e) {
    res.status(500).send({
      success: false,
      message: 'Oops! an error occurred. Please retry, if error persist contact admin',
    })
    throw new Error(e)
  }
}

const get = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10
    const offset = parseInt(req.query.offset, 10) || 0
    const filter = utils.queryFilters(req)
    filter.user = req.body.userId
    const { results, resultCount } = await addressService.get(filter, offset, limit)
    res.send({
      success: true,
      message: 'Successfully fetching addressBooks',
      data: {
        offset,
        limit,
        resultCount,
        results
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

const update = async (req, res) => {
  try {
    const query = { user: req.body.userId, _id: req.params.id }
    const addressBook = await addressService.update(query, req.body)
    if (!addressBook) {
      return res.send({
        success: true,
        message: 'Unauthorized! you don\'t own this record',
        data: addressBook
      }).status(401)
    }
    return res.send({ success: true, message: 'Updated Successfully', data: addressBook })
  } catch (e) {
    res.status(500).send({
      success: false,
      message: 'Oops! an error occurred. Please retry, if error persist contact admin',
    })
    throw new Error(e)
  }
}

const destroy = async (req, res) => {
  const addressBook = await addressService.remove({ user: req.body.userId, _id: req.params.id })
  res.send({
    status: true,
    message: 'Deleted successfully',
    data: addressBook
  })
}

module.exports = {
  create,
  get,
  update,
  destroy
}
