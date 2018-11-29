/**
 * Register a new user into the application
 * Ensures all fields are not empty
 * Ensures all field input satisfy validation rules
 * Ensures that a user that already exists is not registered
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res
 */
const register = (req, res) => {
  // Your logic here
  // for example to access the SampleModel use req.Models.Sample
  req.Models.Sample.find({}, (err, samples) => {
    if (err) throw err
    return res.send(samples)
  })
}

module.exports = {
  register
}
