
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
