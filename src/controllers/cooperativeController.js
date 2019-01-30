const update = (req, res) => {
  req.Models.User.findOne({ _id: req.body.userId })
    .exec((err, user) => {
      if (err) {
        throw err
      } else {
        user.firstName = req.body.firstName || user.firstName
        user.lastName = req.body.lastName || user.lastName
        user.email = req.body.email || user.email
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber
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
  update
}
