const updateAccountStatus = (req, res) => {
  req.Models.User.findOneAndUpdate({ _id: req.params.userId },
    { status: req.body.status }, (err, user) => {
      if (err) throw err
      else {
        return res.send({
          success: true,
          message: 'Account status updated',
          data: user,
        })
      }
    })
}

module.exports = {
  updateAccountStatus
}