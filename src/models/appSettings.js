const mongoose = require("mongoose");

const { Schema } = mongoose;
const Hero = new Schema({
  imageUrl: String,
  title: String,
  subTitle: String,
  action: String,
  link: String
});
const Featured = new Schema({
  product: {
    type: Schema.ObjectId,
    ref: "Inventory",
    required: true
  }
});
const App = new Schema({
  heroes: [Hero],
  featuredItems: [Featured],
  page: {
    type: String,
    enum: ["landing"],
    default: "landing"
  }
});

module.exports = mongoose.model("App", App);
