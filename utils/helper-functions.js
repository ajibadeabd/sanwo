const crypto = require('crypto')

module.exports.queryFilters = (req) => {
  const { query } = req
  const queryKeys = Object.keys(query)

  const filter = {}
  if (queryKeys.length) {
    const ignore = [
      'limit',
      'offset',
      'startDate',
      'endDate',
      'approvalStatus'
    ]
    queryKeys.forEach((key) => {
      if (!ignore.includes(key)) {
        filter[key] = query[key]
      }
    })
  }
  return filter
}

module.exports.isJson = (item) => {
  item = typeof item !== 'string' ? JSON.stringify(item) : item
  try {
    item = JSON.parse(item)
  } catch (e) {
    return false
  }
  return typeof item === 'object' && item !== null
}

module.exports.generateToken = () => new Promise((resolve, reject) => {
  crypto.randomBytes(20, (error, buffer) => {
    if (error) return reject(error)
    resolve(buffer.toString('hex'))
  })
})

module.exports.flattenArray = arrays => arrays.reduce((acc, val) => acc.concat(val))
