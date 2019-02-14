
module.exports.queryFilters = (req) => {
  const { query } = req
  const queryKeys = Object.keys(query)

  const filter = {}
  if (queryKeys.length) {
    queryKeys.forEach((key) => {
      if (key !== 'limit' && key !== 'offset') filter[key] = query[key]
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

module.exports.flattenArray = arrays => arrays.reduce((acc, val) => acc.concat(val))
