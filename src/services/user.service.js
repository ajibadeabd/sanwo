const { User, Inventory } = require('../models')
const { constants } = require('../../utils/helpers')

/**
 * @description Create user record
 * @param {Object} data
 * @return {Promise} record payload || error
 */
const create = async (data) => {
  try {
    const result = await User.create(data)
    return Promise.resolve(result)
  } catch (e) {
    return Promise.reject(new Error(e.message))
  }
}

/**
 * @description updates a user record
 * @param { String} id
 * @param { Object } data
 * @return {Promise<any>} updated user object
 */
const update = async (id, data) => {
  const result = User.findByIdAndUpdate(id, data, { new: true })
  return Promise.resolve(result)
}

/**
 * @description get users records
 * @param {Object} filter
 * @param {Number} offset
 * @param {Number} limit
 * @return {Promise<*>} Object(result, and count) or error
 */
const get = async (filter, offset = 0, limit = 10) => {
  try {
    filter.deletedAt = undefined
    const results = await User.find(filter)
      .populate('user', 'avatar firstName lastName email phoneNumber')
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: 'desc' })
    const resultCount = await User.countDocuments(filter)
    return Promise.resolve({ results, resultCount })
  } catch (e) {
    return Promise.reject(new Error(e.message))
  }
}

/**
 * @description Deletes a user by appending the user email and phone so it can be reused and set
 * deletedAt and deletedBy value
 * @param {String} id the user id to be deleted
 * @param {String} deletedBy the current admin Id so we can know who deleted this user
 * @return {Promise<any>} User object
 */
const destroy = async (id, deletedBy) => {
  const user = await User.findById(id)
  const deletedAt = Date.now()
  user.phoneNumber = `${user.phoneNumber}_${deletedAt}`
  user.email = `${user.email}_${deletedAt}`
  user.deletedAt = deletedAt
  user.deletedBy = deletedBy

  if (user.accountType === constants.SELLER) {
    await Inventory.updateMany({ seller: user._id }, { deletedAt, deletedBy })
  }

  user.save()
  return Promise.resolve(user)
}

module.exports = {
  update,
  get,
  create,
  destroy
}
