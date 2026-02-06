// const express = require("express");
// const mongoose = require("mongoose");
// require("dotenv").config();

// const app = express();
// app.use(express.json());

// // --------------------
// // MongoDB Connection
// // --------------------
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.error("MongoDB Error:", err));


// // --------------------
// // Customer Schema
// // --------------------

// const addressSchema = new mongoose.Schema({
//   street: String,
//   area: String,
//   city: String,
//   state: String,
//   pincode: String,
//   country: String
// }, { _id: false });


// const companySchema = new mongoose.Schema({
//   name: String,
//   employeeId: String,
//   department: String
// }, { _id: false });


// const customerSchema = new mongoose.Schema({

//   // Custom ID like CUST001
//   _id: {
//     type: String,
//     required: true
//   },

//   name: {
//     type: String,
//     required: true
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },

//   phone: {
//     type: String,
//     required: true
//   },

//   company: companySchema,

//   address: addressSchema,

//   accountType: {
//     type: String,
//     enum: ["Basic", "Premium", "Enterprise"],
//     default: "Basic"
//   },

//   balance: {
//     type: Number,
//     default: 0
//   },

//   status: {
//     type: String,
//     enum: ["Active", "Inactive", "Blocked"],
//     default: "Active"
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now
//   },

//   modifiedAt: {
//     type: Date,
//     default: Date.now
//   }

// });


// // Auto-update modifiedAt on save
// customerSchema.pre("save", function (next) {
//   this.modifiedAt = new Date();
//   next();
// });


// // Auto-update modifiedAt on update
// customerSchema.pre("findOneAndUpdate", function (next) {
//   this.set({ modifiedAt: new Date() });
//   next();
// });


// const Customer = mongoose.model("Customer", customerSchema);


// // --------------------
// // Routes
// // --------------------


// // Get Customer by ID
// app.get("/customer/:id", async (req, res) => {
//   try {
//     const data = await Customer.findById(req.params.id);

//     if (!data) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     res.json(data);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // Create New Customer
// app.post("/customer", async (req, res) => {
//   try {

//     const customer = new Customer(req.body);
//     await customer.save();

//     res.status(201).json(customer);

//   } catch (err) {

//     res.status(400).json({
//       error: err.message
//     });

//   }
// });


// // Update Balance
// app.put("/customer/:id/balance", async (req, res) => {
//   try {

//     const { balance } = req.body;

//     if (balance < 0) {
//       return res.status(400).json({ message: "Balance cannot be negative" });
//     }

//     const updated = await Customer.findByIdAndUpdate(
//       req.params.id,
//       { balance },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     res.json(updated);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // Update Full Profile (For AI + Admin)
// app.put("/customer/:id", async (req, res) => {
//   try {

//     const updated = await Customer.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     res.json(updated);

//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });


// // --------------------
// // Server Start
// // --------------------

// app.listen(3000, () => {
//   console.log("Server running on port 3000");
// });

const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());


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


customerSchema.pre("save", function (next) {
  this.modifiedAt = new Date();
  next();
});

customerSchema.pre("findOneAndUpdate", function (next) {
  this.set({ modifiedAt: new Date() });
  next();
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
