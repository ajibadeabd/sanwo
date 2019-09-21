const { AddressBook } = require('../models')

/**
 * @description Create address book record
 * @param {Object} data
 * @return {Promise} record payload || error
 */
const create = async (data) => {
  try {
    const result = await AddressBook.create(data)
    return Promise.resolve(result)
  } catch (e) {
    return Promise.reject(new Error(e.message))
  }
}

/**
 * @description get address records
 * @param {Object} filter
 * @param {Number} offset
 * @param {Number} limit
 * @return {Promise<*>} Object(result, and count) or error
 */
const get = async (filter, offset = 0, limit = 10) => {
  try {
    const results = await AddressBook.find(filter)
      .populate('user', 'avatar firstName lastName email phoneNumber')
      .skip(offset)
      .limit(limit)
    const resultCount = await AddressBook.countDocuments(filter)
    return Promise.resolve({ results, resultCount })
  } catch (e) {
    return Promise.reject(new Error(e.message))
  }
}

/**
 * @description update address record
 * @param { Object } query
 * @param { Object } data
 * @return {Promise<any>} record or error
 */
const update = (query, data) => new Promise(async (resolve, reject) => {
  const addressBook = await AddressBook.findOne(query)
  if (!addressBook) {
    reject(addressBook)
    return
  }
  addressBook.firstName = data.firstName || addressBook.firstName
  addressBook.lastName = data.lastName || addressBook.lastName
  addressBook.phoneNumber = data.phoneNumber || addressBook.phoneNumber
  addressBook.address = data.address || addressBook.address
  addressBook.additionalInfo = data.additionalInfo || addressBook.additionalInfo
  addressBook.state = data.state || addressBook.state
  addressBook.zip = data.zip || addressBook.zip
  addressBook.city = data.city || addressBook.city
  addressBook.save((error) => {
    if (error) {
      reject(error)
      return
    }
    resolve(addressBook)
  })
})

const remove = async (query) => {
  const result = await AddressBook.findOneAndDelete(query)
  return Promise.resolve(result)
}

module.exports = {
  create,
  get,
  update,
  remove
}
