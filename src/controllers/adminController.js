const utils = require('../../utils/helper-functions')

const updateAccountStatus = (req, res) => {
  req.Models.User.findOneAndUpdate({ _id: req.params.userId },
    { status: req.body.status }, (err, user) => {
      if (err) {
        throw err
      } else {
        // TODO notify use of account status change
        return res.send({
          success: true,
          message: 'Account status updated',
          data: user,
        })
      }
    })
}

const getUsers = (req, res) => {
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10
  const filter = utils.queryFilters(req)
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

const profileUpdate = (req, res) => {
  req.Models.User.findOne({ _id: req.body.userId })
    .exec((err, user) => {
      if (err) {
        throw err
      } else {
        user.name = req.body.name || user.name
        user.email = req.body.email || user.email
        user.password = req.body.password || user.password
        user.save((error) => {
          if (error) throw error
          return res.send({
            success: true,
            message: 'Updated successfully',
            data: user,
            token: req.headers['x-access-token']
          })
        })
      }
    })
}

module.exports = {
  updateAccountStatus,
  getUsers,
  profileUpdate
}
