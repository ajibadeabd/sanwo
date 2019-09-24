// const search = (req, res) => {
//   req.Models.Inventory.find({
//     $text: { $search: req.body.query }
//   }, (err, result) => {
//     if (err) throw err
//     else {
//       res.send({
//         status: 'success',
//         message: 'Returned Results',
//         data: result
//       }).status(201)
//     }
//   })
// }

// module.exports = {
//   search
// }