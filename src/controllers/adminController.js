const updateAccountStatus = (req, res) => {
  req.Models.User.findOneAndUpdate({ _id: req.params.userId },
    { status: req.body.status }, (err, user) => {
      if (err) {
        throw err
      } else {
        return res.send({
          success: true,
          message: 'Account status updated',
          data: user,
        })
      }
    })
}

const getUsers = (req, res) => {
  let limit = parseInt(req.query.limit)
  let offset = parseInt(req.query.offset)
  offset = offset || 0
  limit = limit || 10

  const { query } = req
  const queryKeys = Object.keys(query)

  const filter = {}
  if (queryKeys.length) {
    queryKeys.forEach((key) => {
      filter[key] = query[key]
    })
  }
  const model = req.Models.User.find(filter)
  model.skip(offset)
  model.limit(limit)
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching users',
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

module.exports = {
  updateAccountStatus,
  getUsers
}