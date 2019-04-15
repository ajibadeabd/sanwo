const { User } = require('../models')

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
  const result = User.findOneAndUpdate(id, data, { upsert: true, new: true })
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
    const results = await User.find(filter)
      .populate('user', 'avatar firstName lastName email phoneNumber')
      .skip(offset)
      .limit(limit)
    const resultCount = await User.countDocuments(filter)
    return Promise.resolve({ results, resultCount })
  } catch (e) {
    return Promise.reject(new Error(e.message))
  }
}

module.exports = {
  update,
  get,
  create
}
