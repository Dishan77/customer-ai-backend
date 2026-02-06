const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());


// --------------------
// API Key Security
// --------------------

app.use((req, res, next) => {

  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      message: "Unauthorized: Invalid API Key"
    });
  }

  next();
});



// --------------------
// MongoDB Connection (Cache for Serverless)
// --------------------

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(process.env.MONGO_URI);

  isConnected = true;
  console.log("MongoDB Connected");
}

connectDB();


// --------------------
// Schemas
// --------------------

const addressSchema = new mongoose.Schema({
  street: String,
  area: String,
  city: String,
  state: String,
  pincode: String,
  country: String
}, { _id: false });


const companySchema = new mongoose.Schema({
  name: String,
  employeeId: String,
  department: String
}, { _id: false });


const customerSchema = new mongoose.Schema({

  _id: String,

  name: String,
  email: String,
  phone: String,

  company: companySchema,
  address: addressSchema,

  accountType: String,
  balance: Number,
  status: String,

  createdAt: {
    type: Date,
    default: Date.now
  },

  modifiedAt: {
    type: Date,
    default: Date.now
  }

});


// customerSchema.pre("save", function (next) {
//   this.modifiedAt = new Date();
//   next();
// });

// customerSchema.pre("findOneAndUpdate", function (next) {
//   this.set({ modifiedAt: new Date() });
//   next();
// });

customerSchema.pre("save", function () {
  this.modifiedAt = new Date();
});

customerSchema.pre("findOneAndUpdate", function () {
  this.set({ modifiedAt: new Date() });
});


const Customer =
  mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);


// --------------------
// Routes
// --------------------

app.get("/api/customer/:id", async (req, res) => {

  await connectDB();

  const data = await Customer.findById(req.params.id);

  if (!data) {
    return res.status(404).json({ message: "Customer not found" });
  }

  res.json(data);
});


app.post("/api/customer", async (req, res) => {

  await connectDB();

  const customer = new Customer(req.body);
  await customer.save();

  res.status(201).json(customer);
});


app.put("/api/customer/:id/balance", async (req, res) => {

  await connectDB();

  const updated = await Customer.findByIdAndUpdate(
    req.params.id,
    { balance: req.body.balance },
    { new: true }
  );

  res.json(updated);
});


app.put("/api/customer/:id", async (req, res) => {

  await connectDB();

  const updated = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updated);
});


// --------------------
// Export for Vercel
// --------------------

module.exports = app;
