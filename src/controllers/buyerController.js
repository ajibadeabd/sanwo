const userService = require('../services/user.service')

const update = async (req, res) => {
  const user = await req.Models.User.findById(req.body.userId)
  const result = await userService.update(req.body.userId, {
    firstName: req.body.firstName || user.firstName,
    lastName: req.body.lastName || user.lastName,
    email: req.body.email || user.email,
    phoneNumber: req.body.phoneNumber || user.phoneNumber,
    password: req.body.password || user.password,
    address: req.body.address || user.address
  })

  return res.send({
    success: true,
    message: 'Updated successfully',
    data: result,
    token: req.headers['x-access-token']
  })
}

module.exports = {
  update
}
