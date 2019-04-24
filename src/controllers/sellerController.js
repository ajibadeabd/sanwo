const bcrypt = require('bcrypt')

const update = (req, res) => {
  req.Models.User.findOne({ _id: req.body.userId })
    .exec((err, user) => {
      if (err) {
        throw err
      } else {
        if (req.body.password && bcrypt.compareSync(req.body.password, user.password)) {
          return res.status(400)
            .send({
              success: false,
              message: 'Old password is incorrect',
              data: null
            })
        }
        user.firstName = req.body.firstName || user.firstName
        user.lastName = req.body.lastName || user.lastName
        user.email = req.body.email || user.email
        user.businessAddress = req.body.businessAddress || user.businessAddress
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
