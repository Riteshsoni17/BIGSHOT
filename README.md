 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
new file mode 100644
index 0000000000000000000000000000000000000000..119f033ee6f1a08d0d4d1e39c0b22f08886dbdbf
--- /dev/null
+++ b/README.md
@@ -0,0 +1,72 @@
+# Shikhar Wellness CRM
+
+Production-ready CRM for Shikhar Wellness with Node.js (Express), MongoDB (Mongoose), JWT authentication, and a React PWA frontend.
+
+## Features
+
+- Role-based access: Admin & Agent
+- Lead management with auto-assignment (round-robin) and history log
+- Order management with address + lat/lng storage
+- Product and inventory module (auto stock reduction)
+- Reports & exports (Excel)
+- Phase 2 & 3 ready placeholders for courier, WhatsApp, and AI call logs
+
+## Tech Stack
+
+- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT
+- **Frontend**: React + Vite (mobile responsive, PWA-ready)
+
+## Project Structure
+
+```
+backend/    Express API, MongoDB models, controllers, routes
+frontend/   React app with dashboards and forms
+```
+
+## Backend Setup
+
+```bash
+cd backend
+cp .env.example .env
+npm install
+npm run dev
+```
+
+### Environment Variables
+
+- `MONGO_URI` - MongoDB connection string
+- `JWT_SECRET` - JWT secret
+- `JWT_EXPIRES_IN` - token expiry duration
+
+## Frontend Setup
+
+```bash
+cd frontend
+cp .env.example .env
+npm install
+npm run dev
+```
+
+### Environment Variables
+
+- `VITE_API_URL` - API base URL
+- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps Places API key
+
+## API Highlights
+
+- `POST /api/auth/login`
+- `POST /api/auth/agents` (admin)
+- `GET /api/leads`
+- `POST /api/leads`
+- `POST /api/orders`
+- `GET /api/reports/export/orders`
+
+## Deployment Notes
+
+- Use `npm run build` in `/frontend` to generate production assets.
+- Deploy backend API and host frontend on a static hosting provider or CDN.
+- Ensure CORS configuration for production domains.
+
+## License
+
+MIT
diff --git a/backend/.env.example b/backend/.env.example
new file mode 100644
index 0000000000000000000000000000000000000000..ae2a482e96e7631d6b60e84ca82a093f34e58cc0
--- /dev/null
+++ b/backend/.env.example
@@ -0,0 +1,4 @@
+PORT=4000
+MONGO_URI=mongodb://localhost:27017/shikhar-wellness-crm
+JWT_SECRET=change_this_secret
+JWT_EXPIRES_IN=7d
diff --git a/backend/package.json b/backend/package.json
new file mode 100644
index 0000000000000000000000000000000000000000..5bee1dad7f772bf3af2e8f314692cb5f078211ad
--- /dev/null
+++ b/backend/package.json
@@ -0,0 +1,32 @@
+{
+  "name": "shikhar-wellness-crm-backend",
+  "version": "1.0.0",
+  "description": "Backend API for Shikhar Wellness CRM",
+  "main": "src/server.js",
+  "scripts": {
+    "start": "node src/server.js",
+    "dev": "nodemon src/server.js"
+  },
+  "keywords": [
+    "crm",
+    "express",
+    "mongodb",
+    "shikhar-wellness"
+  ],
+  "author": "",
+  "license": "MIT",
+  "dependencies": {
+    "bcryptjs": "^2.4.3",
+    "cors": "^2.8.5",
+    "dotenv": "^16.4.5",
+    "exceljs": "^4.4.0",
+    "express": "^4.19.2",
+    "express-validator": "^7.0.1",
+    "jsonwebtoken": "^9.0.2",
+    "mongoose": "^8.6.1",
+    "morgan": "^1.10.0"
+  },
+  "devDependencies": {
+    "nodemon": "^3.1.4"
+  }
+}
diff --git a/backend/src/config/db.js b/backend/src/config/db.js
new file mode 100644
index 0000000000000000000000000000000000000000..010dc8a35cfcd42abd0f5f9ffb3e82bc692d7e73
--- /dev/null
+++ b/backend/src/config/db.js
@@ -0,0 +1,10 @@
+const mongoose = require("mongoose");
+
+const connectDatabase = async (mongoUri) => {
+  await mongoose.connect(mongoUri, {
+    autoIndex: true,
+    serverSelectionTimeoutMS: 10000,
+  });
+};
+
+module.exports = { connectDatabase };
diff --git a/backend/src/controllers/authController.js b/backend/src/controllers/authController.js
new file mode 100644
index 0000000000000000000000000000000000000000..dbf0c634887892cb0d15caa4909b5de301269160
--- /dev/null
+++ b/backend/src/controllers/authController.js
@@ -0,0 +1,41 @@
+const jwt = require("jsonwebtoken");
+const User = require("../models/User");
+const { Roles } = require("../utils/constants");
+
+const generateToken = (user) =>
+  jwt.sign(
+    { id: user._id, role: user.role, name: user.name },
+    process.env.JWT_SECRET,
+    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
+  );
+
+const login = async (req, res, next) => {
+  try {
+    const { email, password } = req.body;
+    const user = await User.findOne({ email });
+    if (!user || !(await user.comparePassword(password))) {
+      return res.status(401).json({ message: "Invalid credentials" });
+    }
+    const token = generateToken(user);
+    return res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const createAgent = async (req, res, next) => {
+  try {
+    const { name, email, phone, password } = req.body;
+    const existing = await User.findOne({ email });
+    if (existing) {
+      return res.status(409).json({ message: "Agent already exists" });
+    }
+    const passwordHash = await User.hashPassword(password);
+    const agent = await User.create({ name, email, phone, passwordHash, role: Roles.AGENT });
+    return res.status(201).json({ id: agent._id, name: agent.name, email: agent.email });
+  } catch (error) {
+    return next(error);
+  }
+};
+
+module.exports = { login, createAgent };
diff --git a/backend/src/controllers/leadController.js b/backend/src/controllers/leadController.js
new file mode 100644
index 0000000000000000000000000000000000000000..61b0e811daeb048d055116628d0a327458aef431
--- /dev/null
+++ b/backend/src/controllers/leadController.js
@@ -0,0 +1,93 @@
+const Lead = require("../models/Lead");
+const { getNextAgent } = require("../services/leadAssignmentService");
+
+const createLead = async (req, res, next) => {
+  try {
+    const { name, phone, source, status, notes } = req.body;
+    const agent = await getNextAgent();
+    const lead = await Lead.create({
+      name,
+      phone,
+      source,
+      status,
+      notes,
+      assignedTo: agent ? agent._id : null,
+      createdBy: req.user.id,
+      history: [
+        {
+          status: status || "New",
+          notes: notes || "Lead created",
+          updatedBy: req.user.id,
+        },
+      ],
+    });
+    return res.status(201).json(lead);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const updateLead = async (req, res, next) => {
+  try {
+    const { id } = req.params;
+    const updates = req.body;
+    const lead = await Lead.findById(id);
+    if (!lead) {
+      return res.status(404).json({ message: "Lead not found" });
+    }
+    Object.assign(lead, updates);
+    lead.history.push({
+      status: updates.status || lead.status,
+      notes: updates.notes || "Lead updated",
+      updatedBy: req.user.id,
+    });
+    await lead.save();
+    return res.json(lead);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const listLeads = async (req, res, next) => {
+  try {
+    const filters = {};
+    if (req.query.status) {
+      filters.status = req.query.status;
+    }
+    if (req.user.role === "agent") {
+      filters.assignedTo = req.user.id;
+    }
+    const leads = await Lead.find(filters).populate("assignedTo", "name email");
+    return res.json(leads);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const assignLead = async (req, res, next) => {
+  try {
+    const { id } = req.params;
+    const lead = await Lead.findById(id);
+    if (!lead) {
+      return res.status(404).json({ message: "Lead not found" });
+    }
+    const agent = await getNextAgent();
+    lead.assignedTo = agent ? agent._id : null;
+    lead.history.push({
+      status: lead.status,
+      notes: "Lead auto-assigned",
+      updatedBy: req.user.id,
+    });
+    await lead.save();
+    return res.json(lead);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+module.exports = {
+  createLead,
+  updateLead,
+  listLeads,
+  assignLead,
+};
diff --git a/backend/src/controllers/orderController.js b/backend/src/controllers/orderController.js
new file mode 100644
index 0000000000000000000000000000000000000000..d6539137a228987de5821af8b322eca8bf729c11
--- /dev/null
+++ b/backend/src/controllers/orderController.js
@@ -0,0 +1,92 @@
+const Order = require("../models/Order");
+const Product = require("../models/Product");
+const Lead = require("../models/Lead");
+
+const calculateTotals = (items) => {
+  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
+  const discountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0);
+  const grandTotal = subtotal - discountTotal;
+  return { subtotal, discountTotal, grandTotal };
+};
+
+const reduceInventory = async (items) => {
+  for (const item of items) {
+    const product = await Product.findById(item.product);
+    if (!product) {
+      throw new Error("Product not found for inventory update");
+    }
+    if (product.stock < item.quantity) {
+      throw new Error(`Insufficient stock for ${product.name}`);
+    }
+    product.stock -= item.quantity;
+    await product.save();
+  }
+};
+
+const createOrder = async (req, res, next) => {
+  try {
+    const payload = req.body;
+    const totals = calculateTotals(payload.items);
+    const order = await Order.create({
+      ...payload,
+      totals,
+      agent: req.user.id,
+    });
+
+    if (payload.lead) {
+      await Lead.findByIdAndUpdate(payload.lead, { status: "Converted" });
+    }
+
+    await reduceInventory(payload.items);
+    order.inventoryReduced = true;
+    await order.save();
+
+    return res.status(201).json(order);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const listOrders = async (req, res, next) => {
+  try {
+    const filters = {};
+    if (req.user.role === "agent") {
+      filters.agent = req.user.id;
+    }
+    const orders = await Order.find(filters)
+      .populate("agent", "name email")
+      .populate("lead", "name phone")
+      .sort({ createdAt: -1 });
+    return res.json(orders);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const updateOrderStatus = async (req, res, next) => {
+  try {
+    const { id } = req.params;
+    const { status, reattempt } = req.body;
+    const order = await Order.findById(id);
+    if (!order) {
+      return res.status(404).json({ message: "Order not found" });
+    }
+    if (status) {
+      order.status = status;
+    }
+    if (reattempt) {
+      order.attempts.reattemptCount += 1;
+      order.attempts.lastAttemptAt = new Date();
+    }
+    await order.save();
+    return res.json(order);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+module.exports = {
+  createOrder,
+  listOrders,
+  updateOrderStatus,
+};
diff --git a/backend/src/controllers/productController.js b/backend/src/controllers/productController.js
new file mode 100644
index 0000000000000000000000000000000000000000..72154dd2424e068143340c2c1eaec6f2981b3d61
--- /dev/null
+++ b/backend/src/controllers/productController.js
@@ -0,0 +1,52 @@
+const Product = require("../models/Product");
+
+const createProduct = async (req, res, next) => {
+  try {
+    const product = await Product.create(req.body);
+    return res.status(201).json(product);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const listProducts = async (req, res, next) => {
+  try {
+    const products = await Product.find().sort({ createdAt: -1 });
+    return res.json(products);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const updateProduct = async (req, res, next) => {
+  try {
+    const { id } = req.params;
+    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
+    if (!product) {
+      return res.status(404).json({ message: "Product not found" });
+    }
+    return res.json(product);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const deleteProduct = async (req, res, next) => {
+  try {
+    const { id } = req.params;
+    const product = await Product.findByIdAndDelete(id);
+    if (!product) {
+      return res.status(404).json({ message: "Product not found" });
+    }
+    return res.status(204).send();
+  } catch (error) {
+    return next(error);
+  }
+};
+
+module.exports = {
+  createProduct,
+  listProducts,
+  updateProduct,
+  deleteProduct,
+};
diff --git a/backend/src/controllers/reportController.js b/backend/src/controllers/reportController.js
new file mode 100644
index 0000000000000000000000000000000000000000..7b6ae847ab985fae75fb2a9c7422a4aa147eab46
--- /dev/null
+++ b/backend/src/controllers/reportController.js
@@ -0,0 +1,116 @@
+const ExcelJS = require("exceljs");
+const Order = require("../models/Order");
+
+const getDailySales = async (req, res, next) => {
+  try {
+    const data = await Order.aggregate([
+      {
+        $group: {
+          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
+          totalSales: { $sum: "$totals.grandTotal" },
+          totalOrders: { $sum: 1 },
+        },
+      },
+      { $sort: { _id: -1 } },
+    ]);
+    return res.json(data);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const getAgentPerformance = async (req, res, next) => {
+  try {
+    const data = await Order.aggregate([
+      {
+        $group: {
+          _id: "$agent",
+          totalSales: { $sum: "$totals.grandTotal" },
+          orders: { $sum: 1 },
+        },
+      },
+    ]);
+    return res.json(data);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const getProductSales = async (req, res, next) => {
+  try {
+    const data = await Order.aggregate([
+      { $unwind: "$items" },
+      {
+        $group: {
+          _id: "$items.product",
+          quantity: { $sum: "$items.quantity" },
+          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
+        },
+      },
+    ]);
+    return res.json(data);
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const getRtoPercentage = async (req, res, next) => {
+  try {
+    const [summary] = await Order.aggregate([
+      {
+        $group: {
+          _id: null,
+          total: { $sum: 1 },
+          rto: { $sum: { $cond: [{ $eq: ["$status", "RTO"] }, 1, 0] } },
+        },
+      },
+    ]);
+    const percentage = summary && summary.total ? (summary.rto / summary.total) * 100 : 0;
+    return res.json({ total: summary?.total || 0, rto: summary?.rto || 0, percentage });
+  } catch (error) {
+    return next(error);
+  }
+};
+
+const exportOrders = async (req, res, next) => {
+  try {
+    const orders = await Order.find().populate("agent", "name");
+    const workbook = new ExcelJS.Workbook();
+    const sheet = workbook.addWorksheet("Orders");
+    sheet.columns = [
+      { header: "Order ID", key: "id", width: 24 },
+      { header: "Customer", key: "customerName", width: 20 },
+      { header: "Phone", key: "customerPhone", width: 14 },
+      { header: "Agent", key: "agent", width: 20 },
+      { header: "Status", key: "status", width: 12 },
+      { header: "Total", key: "total", width: 12 },
+    ];
+    orders.forEach((order) => {
+      sheet.addRow({
+        id: order._id.toString(),
+        customerName: order.customerName,
+        customerPhone: order.customerPhone,
+        agent: order.agent?.name || "Unassigned",
+        status: order.status,
+        total: order.totals.grandTotal,
+      });
+    });
+    res.setHeader(
+      "Content-Type",
+      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
+    );
+    res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
+    await workbook.xlsx.write(res);
+    return res.end();
+  } catch (error) {
+    return next(error);
+  }
+};
+
+module.exports = {
+  getDailySales,
+  getAgentPerformance,
+  getProductSales,
+  getRtoPercentage,
+  exportOrders,
+};
diff --git a/backend/src/middleware/auth.js b/backend/src/middleware/auth.js
new file mode 100644
index 0000000000000000000000000000000000000000..dda23b78ae323145288ae682069cdd04d1d9f52f
--- /dev/null
+++ b/backend/src/middleware/auth.js
@@ -0,0 +1,27 @@
+const jwt = require("jsonwebtoken");
+
+const authenticate = (req, res, next) => {
+  const authHeader = req.headers.authorization || "";
+  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
+
+  if (!token) {
+    return res.status(401).json({ message: "Unauthorized" });
+  }
+
+  try {
+    const decoded = jwt.verify(token, process.env.JWT_SECRET);
+    req.user = decoded;
+    return next();
+  } catch (error) {
+    return res.status(401).json({ message: "Invalid token" });
+  }
+};
+
+const authorizeRoles = (...roles) => (req, res, next) => {
+  if (!req.user || !roles.includes(req.user.role)) {
+    return res.status(403).json({ message: "Forbidden" });
+  }
+  return next();
+};
+
+module.exports = { authenticate, authorizeRoles };
diff --git a/backend/src/middleware/errorHandler.js b/backend/src/middleware/errorHandler.js
new file mode 100644
index 0000000000000000000000000000000000000000..21c24872b2eb2a1b76595cedb23e508d8f83c3c9
--- /dev/null
+++ b/backend/src/middleware/errorHandler.js
@@ -0,0 +1,7 @@
+const errorHandler = (err, req, res, next) => {
+  const status = err.status || 500;
+  const message = err.message || "Something went wrong";
+  return res.status(status).json({ message });
+};
+
+module.exports = { errorHandler };
diff --git a/backend/src/middleware/validate.js b/backend/src/middleware/validate.js
new file mode 100644
index 0000000000000000000000000000000000000000..e0063b874216bbadf963c06bf7da27229f63af94
--- /dev/null
+++ b/backend/src/middleware/validate.js
@@ -0,0 +1,11 @@
+const { validationResult } = require("express-validator");
+
+const validate = (req, res, next) => {
+  const errors = validationResult(req);
+  if (!errors.isEmpty()) {
+    return res.status(400).json({ errors: errors.array() });
+  }
+  return next();
+};
+
+module.exports = { validate };
diff --git a/backend/src/models/CallLog.js b/backend/src/models/CallLog.js
new file mode 100644
index 0000000000000000000000000000000000000000..4e388163a9d6e54ce8d9a090be70990c2a9bc9c5
--- /dev/null
+++ b/backend/src/models/CallLog.js
@@ -0,0 +1,15 @@
+const mongoose = require("mongoose");
+
+const callLogSchema = new mongoose.Schema(
+  {
+    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
+    agent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
+    callRecordingUrl: { type: String },
+    speechToText: { type: String },
+    aiSummary: { type: String },
+    sentimentScore: { type: Number },
+  },
+  { timestamps: true }
+);
+
+module.exports = mongoose.model("CallLog", callLogSchema);
diff --git a/backend/src/models/Lead.js b/backend/src/models/Lead.js
new file mode 100644
index 0000000000000000000000000000000000000000..22f9e49be3d967843bf0d7c7a455ab26123572b0
--- /dev/null
+++ b/backend/src/models/Lead.js
@@ -0,0 +1,27 @@
+const mongoose = require("mongoose");
+const { LeadStatus } = require("../utils/constants");
+
+const leadHistorySchema = new mongoose.Schema(
+  {
+    status: { type: String, enum: Object.values(LeadStatus) },
+    notes: { type: String },
+    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
+  },
+  { timestamps: true }
+);
+
+const leadSchema = new mongoose.Schema(
+  {
+    name: { type: String, required: true, trim: true },
+    phone: { type: String, required: true, trim: true },
+    source: { type: String, required: true, trim: true },
+    status: { type: String, enum: Object.values(LeadStatus), default: LeadStatus.NEW },
+    notes: { type: String, default: "" },
+    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
+    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
+    history: [leadHistorySchema],
+  },
+  { timestamps: true }
+);
+
+module.exports = mongoose.model("Lead", leadSchema);
diff --git a/backend/src/models/Order.js b/backend/src/models/Order.js
new file mode 100644
index 0000000000000000000000000000000000000000..1a259dfedb03bf173dc3e5ba24b2d9f6327e8554
--- /dev/null
+++ b/backend/src/models/Order.js
@@ -0,0 +1,62 @@
+const mongoose = require("mongoose");
+const { OrderStatus, PaymentMode, PaymentStatus } = require("../utils/constants");
+
+const orderItemSchema = new mongoose.Schema(
+  {
+    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
+    name: { type: String, required: true },
+    quantity: { type: Number, required: true, min: 1 },
+    price: { type: Number, required: true, min: 0 },
+    discount: { type: Number, default: 0, min: 0 },
+  },
+  { _id: false }
+);
+
+const orderSchema = new mongoose.Schema(
+  {
+    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
+    agent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
+    customerName: { type: String, required: true },
+    customerPhone: { type: String, required: true },
+    address: {
+      line1: { type: String, required: true },
+      line2: { type: String },
+      city: { type: String, required: true },
+      state: { type: String, required: true },
+      pincode: { type: String, required: true },
+      latitude: { type: Number },
+      longitude: { type: Number },
+      placeId: { type: String },
+    },
+    items: [orderItemSchema],
+    totals: {
+      subtotal: { type: Number, required: true },
+      discountTotal: { type: Number, default: 0 },
+      grandTotal: { type: Number, required: true },
+    },
+    paymentMode: { type: String, enum: Object.values(PaymentMode), required: true },
+    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
+    courier: {
+      name: { type: String },
+      awbNumber: { type: String },
+    },
+    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PACKED },
+    attempts: {
+      reattemptCount: { type: Number, default: 0 },
+      lastAttemptAt: { type: Date },
+    },
+    inventoryReduced: { type: Boolean, default: false },
+    courierIntegration: {
+      provider: { type: String },
+      referenceId: { type: String },
+      payload: { type: Object },
+    },
+    whatsappIntegration: {
+      messageId: { type: String },
+      payload: { type: Object },
+    },
+  },
+  { timestamps: true }
+);
+
+module.exports = mongoose.model("Order", orderSchema);
diff --git a/backend/src/models/Product.js b/backend/src/models/Product.js
new file mode 100644
index 0000000000000000000000000000000000000000..011a84ef3e255e152dbac7b7fd443fb566814b96
--- /dev/null
+++ b/backend/src/models/Product.js
@@ -0,0 +1,14 @@
+const mongoose = require("mongoose");
+
+const productSchema = new mongoose.Schema(
+  {
+    name: { type: String, required: true, trim: true },
+    mrp: { type: Number, required: true, min: 0 },
+    sellingPrice: { type: Number, required: true, min: 0 },
+    stock: { type: Number, required: true, min: 0 },
+    lowStockThreshold: { type: Number, default: 10 },
+  },
+  { timestamps: true }
+);
+
+module.exports = mongoose.model("Product", productSchema);
diff --git a/backend/src/models/User.js b/backend/src/models/User.js
new file mode 100644
index 0000000000000000000000000000000000000000..98659a3e42aec4379da607701ae791d9d6decc8c
--- /dev/null
+++ b/backend/src/models/User.js
@@ -0,0 +1,27 @@
+const mongoose = require("mongoose");
+const bcrypt = require("bcryptjs");
+const { Roles } = require("../utils/constants");
+
+const userSchema = new mongoose.Schema(
+  {
+    name: { type: String, required: true, trim: true },
+    email: { type: String, required: true, unique: true, lowercase: true },
+    phone: { type: String, required: true, trim: true },
+    role: { type: String, enum: Object.values(Roles), default: Roles.AGENT },
+    passwordHash: { type: String, required: true },
+    isActive: { type: Boolean, default: true },
+    lastAssignedAt: { type: Date, default: null },
+  },
+  { timestamps: true }
+);
+
+userSchema.methods.comparePassword = async function comparePassword(password) {
+  return bcrypt.compare(password, this.passwordHash);
+};
+
+userSchema.statics.hashPassword = async function hashPassword(password) {
+  const salt = await bcrypt.genSalt(10);
+  return bcrypt.hash(password, salt);
+};
+
+module.exports = mongoose.model("User", userSchema);
diff --git a/backend/src/routes/authRoutes.js b/backend/src/routes/authRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..f3f11d005b25c5402bef23e8a8920f0ee18a488c
--- /dev/null
+++ b/backend/src/routes/authRoutes.js
@@ -0,0 +1,19 @@
+const express = require("express");
+const { login, createAgent } = require("../controllers/authController");
+const { authenticate, authorizeRoles } = require("../middleware/auth");
+const { validate } = require("../middleware/validate");
+const { loginValidator, createAgentValidator } = require("../validators/authValidators");
+
+const router = express.Router();
+
+router.post("/login", loginValidator, validate, login);
+router.post(
+  "/agents",
+  authenticate,
+  authorizeRoles("admin"),
+  createAgentValidator,
+  validate,
+  createAgent
+);
+
+module.exports = router;
diff --git a/backend/src/routes/leadRoutes.js b/backend/src/routes/leadRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..5f98d97730660fe503d686cce5320a025fb89e74
--- /dev/null
+++ b/backend/src/routes/leadRoutes.js
@@ -0,0 +1,16 @@
+const express = require("express");
+const { authenticate, authorizeRoles } = require("../middleware/auth");
+const { validate } = require("../middleware/validate");
+const { leadValidator } = require("../validators/leadValidators");
+const { createLead, updateLead, listLeads, assignLead } = require("../controllers/leadController");
+
+const router = express.Router();
+
+router.use(authenticate);
+
+router.get("/", listLeads);
+router.post("/", leadValidator, validate, createLead);
+router.patch("/:id", leadValidator, validate, updateLead);
+router.post("/:id/assign", authorizeRoles("admin"), assignLead);
+
+module.exports = router;
diff --git a/backend/src/routes/orderRoutes.js b/backend/src/routes/orderRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..c5996b56d87a7c6a7889998b59d51b8ecda3433f
--- /dev/null
+++ b/backend/src/routes/orderRoutes.js
@@ -0,0 +1,15 @@
+const express = require("express");
+const { authenticate } = require("../middleware/auth");
+const { validate } = require("../middleware/validate");
+const { orderValidator } = require("../validators/orderValidators");
+const { createOrder, listOrders, updateOrderStatus } = require("../controllers/orderController");
+
+const router = express.Router();
+
+router.use(authenticate);
+
+router.get("/", listOrders);
+router.post("/", orderValidator, validate, createOrder);
+router.patch("/:id/status", updateOrderStatus);
+
+module.exports = router;
diff --git a/backend/src/routes/productRoutes.js b/backend/src/routes/productRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..bfb4c3ee1f31c5e1b3618e0135f1a47861400c3b
--- /dev/null
+++ b/backend/src/routes/productRoutes.js
@@ -0,0 +1,21 @@
+const express = require("express");
+const { authenticate, authorizeRoles } = require("../middleware/auth");
+const { validate } = require("../middleware/validate");
+const { productValidator } = require("../validators/productValidators");
+const {
+  createProduct,
+  listProducts,
+  updateProduct,
+  deleteProduct,
+} = require("../controllers/productController");
+
+const router = express.Router();
+
+router.use(authenticate);
+
+router.get("/", listProducts);
+router.post("/", authorizeRoles("admin"), productValidator, validate, createProduct);
+router.patch("/:id", authorizeRoles("admin"), productValidator, validate, updateProduct);
+router.delete("/:id", authorizeRoles("admin"), deleteProduct);
+
+module.exports = router;
diff --git a/backend/src/routes/reportRoutes.js b/backend/src/routes/reportRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..405cc9a14ed05855dca73ebb9076a0d1dfede3c8
--- /dev/null
+++ b/backend/src/routes/reportRoutes.js
@@ -0,0 +1,21 @@
+const express = require("express");
+const { authenticate, authorizeRoles } = require("../middleware/auth");
+const {
+  getDailySales,
+  getAgentPerformance,
+  getProductSales,
+  getRtoPercentage,
+  exportOrders,
+} = require("../controllers/reportController");
+
+const router = express.Router();
+
+router.use(authenticate, authorizeRoles("admin"));
+
+router.get("/daily-sales", getDailySales);
+router.get("/agent-performance", getAgentPerformance);
+router.get("/product-sales", getProductSales);
+router.get("/rto", getRtoPercentage);
+router.get("/export/orders", exportOrders);
+
+module.exports = router;
diff --git a/backend/src/server.js b/backend/src/server.js
new file mode 100644
index 0000000000000000000000000000000000000000..80ea31a2fa669115b166f420a721b724035cb0a2
--- /dev/null
+++ b/backend/src/server.js
@@ -0,0 +1,41 @@
+require("dotenv").config();
+const express = require("express");
+const cors = require("cors");
+const morgan = require("morgan");
+const { connectDatabase } = require("./config/db");
+const { errorHandler } = require("./middleware/errorHandler");
+
+const authRoutes = require("./routes/authRoutes");
+const leadRoutes = require("./routes/leadRoutes");
+const orderRoutes = require("./routes/orderRoutes");
+const productRoutes = require("./routes/productRoutes");
+const reportRoutes = require("./routes/reportRoutes");
+
+const app = express();
+
+app.use(cors());
+app.use(express.json({ limit: "2mb" }));
+app.use(morgan("dev"));
+
+app.get("/health", (req, res) => res.json({ status: "ok" }));
+
+app.use("/api/auth", authRoutes);
+app.use("/api/leads", leadRoutes);
+app.use("/api/orders", orderRoutes);
+app.use("/api/products", productRoutes);
+app.use("/api/reports", reportRoutes);
+
+app.use(errorHandler);
+
+const PORT = process.env.PORT || 4000;
+
+connectDatabase(process.env.MONGO_URI)
+  .then(() => {
+    app.listen(PORT, () => {
+      console.log(`Server running on port ${PORT}`);
+    });
+  })
+  .catch((error) => {
+    console.error("Database connection failed", error);
+    process.exit(1);
+  });
diff --git a/backend/src/services/leadAssignmentService.js b/backend/src/services/leadAssignmentService.js
new file mode 100644
index 0000000000000000000000000000000000000000..b548b59cf75847f09957e9a9ea8308c4c06400d6
--- /dev/null
+++ b/backend/src/services/leadAssignmentService.js
@@ -0,0 +1,17 @@
+const User = require("../models/User");
+const { Roles } = require("../utils/constants");
+
+const getNextAgent = async () => {
+  const agents = await User.find({ role: Roles.AGENT, isActive: true })
+    .sort({ lastAssignedAt: 1 })
+    .limit(1);
+  if (!agents.length) {
+    return null;
+  }
+  const agent = agents[0];
+  agent.lastAssignedAt = new Date();
+  await agent.save();
+  return agent;
+};
+
+module.exports = { getNextAgent };
diff --git a/backend/src/utils/constants.js b/backend/src/utils/constants.js
new file mode 100644
index 0000000000000000000000000000000000000000..c812ca74784051a243fcb85f6c5ca398d5ab1ebe
--- /dev/null
+++ b/backend/src/utils/constants.js
@@ -0,0 +1,40 @@
+const Roles = Object.freeze({
+  ADMIN: "admin",
+  AGENT: "agent",
+});
+
+const LeadStatus = Object.freeze({
+  NEW: "New",
+  FOLLOW_UP: "Follow-up",
+  HOT: "Hot",
+  CONVERTED: "Converted",
+  DEAD: "Dead",
+});
+
+const OrderStatus = Object.freeze({
+  PACKED: "Packed",
+  SHIPPED: "Shipped",
+  OFD: "OFD",
+  DELIVERED: "Delivered",
+  RTO: "RTO",
+  NDR: "NDR",
+});
+
+const PaymentMode = Object.freeze({
+  COD: "COD",
+  ONLINE: "Online",
+});
+
+const PaymentStatus = Object.freeze({
+  PENDING: "Pending",
+  PAID: "Paid",
+  FAILED: "Failed",
+});
+
+module.exports = {
+  Roles,
+  LeadStatus,
+  OrderStatus,
+  PaymentMode,
+  PaymentStatus,
+};
diff --git a/backend/src/validators/authValidators.js b/backend/src/validators/authValidators.js
new file mode 100644
index 0000000000000000000000000000000000000000..d2a04f3261260df075bcf3987000daf369878c10
--- /dev/null
+++ b/backend/src/validators/authValidators.js
@@ -0,0 +1,15 @@
+const { body } = require("express-validator");
+
+const loginValidator = [
+  body("email").isEmail().withMessage("Valid email is required"),
+  body("password").isLength({ min: 6 }).withMessage("Password is required"),
+];
+
+const createAgentValidator = [
+  body("name").notEmpty().withMessage("Name is required"),
+  body("email").isEmail().withMessage("Valid email is required"),
+  body("phone").notEmpty().withMessage("Phone is required"),
+  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
+];
+
+module.exports = { loginValidator, createAgentValidator };
diff --git a/backend/src/validators/leadValidators.js b/backend/src/validators/leadValidators.js
new file mode 100644
index 0000000000000000000000000000000000000000..e2b2afce1335da5ddcaf8a25353b3e50e915a27d
--- /dev/null
+++ b/backend/src/validators/leadValidators.js
@@ -0,0 +1,12 @@
+const { body } = require("express-validator");
+const { LeadStatus } = require("../utils/constants");
+
+const leadValidator = [
+  body("name").notEmpty().withMessage("Name is required"),
+  body("phone").notEmpty().withMessage("Phone is required"),
+  body("source").notEmpty().withMessage("Source is required"),
+  body("status").optional().isIn(Object.values(LeadStatus)),
+  body("notes").optional().isString(),
+];
+
+module.exports = { leadValidator };
diff --git a/backend/src/validators/orderValidators.js b/backend/src/validators/orderValidators.js
new file mode 100644
index 0000000000000000000000000000000000000000..2522230cd8a403db096cf6c932ccbc52a11047d6
--- /dev/null
+++ b/backend/src/validators/orderValidators.js
@@ -0,0 +1,20 @@
+const { body } = require("express-validator");
+const { OrderStatus, PaymentMode, PaymentStatus } = require("../utils/constants");
+
+const orderValidator = [
+  body("customerName").notEmpty().withMessage("Customer name is required"),
+  body("customerPhone").notEmpty().withMessage("Customer phone is required"),
+  body("address.line1").notEmpty().withMessage("Address line1 is required"),
+  body("address.city").notEmpty().withMessage("City is required"),
+  body("address.state").notEmpty().withMessage("State is required"),
+  body("address.pincode").notEmpty().withMessage("Pincode is required"),
+  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
+  body("items.*.product").notEmpty().withMessage("Product is required"),
+  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be >= 1"),
+  body("items.*.price").isFloat({ min: 0 }).withMessage("Price must be >= 0"),
+  body("paymentMode").isIn(Object.values(PaymentMode)).withMessage("Payment mode is invalid"),
+  body("paymentStatus").optional().isIn(Object.values(PaymentStatus)),
+  body("status").optional().isIn(Object.values(OrderStatus)),
+];
+
+module.exports = { orderValidator };
diff --git a/backend/src/validators/productValidators.js b/backend/src/validators/productValidators.js
new file mode 100644
index 0000000000000000000000000000000000000000..2ebf6f1f01ba3cce6cc583c86933ac5d78f1d399
--- /dev/null
+++ b/backend/src/validators/productValidators.js
@@ -0,0 +1,10 @@
+const { body } = require("express-validator");
+
+const productValidator = [
+  body("name").notEmpty().withMessage("Name is required"),
+  body("mrp").isFloat({ min: 0 }).withMessage("MRP must be >= 0"),
+  body("sellingPrice").isFloat({ min: 0 }).withMessage("Selling price must be >= 0"),
+  body("stock").isInt({ min: 0 }).withMessage("Stock must be >= 0"),
+];
+
+module.exports = { productValidator };
diff --git a/frontend/.env.example b/frontend/.env.example
new file mode 100644
index 0000000000000000000000000000000000000000..c1087d1e8f33f897809a099d85e1bb5bd4efee9e
--- /dev/null
+++ b/frontend/.env.example
@@ -0,0 +1,2 @@
+VITE_API_URL=http://localhost:4000/api
+VITE_GOOGLE_MAPS_API_KEY=your_key_here
diff --git a/frontend/index.html b/frontend/index.html
new file mode 100644
index 0000000000000000000000000000000000000000..181632e4c9401b8aaebc7b1d0caa1b0cf847c7f8
--- /dev/null
+++ b/frontend/index.html
@@ -0,0 +1,14 @@
+<!DOCTYPE html>
+<html lang="en">
+  <head>
+    <meta charset="UTF-8" />
+    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+    <link rel="manifest" href="/manifest.json" />
+    <meta name="theme-color" content="#0f172a" />
+    <title>Shikhar Wellness CRM</title>
+  </head>
+  <body>
+    <div id="root"></div>
+    <script type="module" src="/src/main.jsx"></script>
+  </body>
+</html>
diff --git a/frontend/package.json b/frontend/package.json
new file mode 100644
index 0000000000000000000000000000000000000000..021355db2fb78016acb55da5c63dee159355f761
--- /dev/null
+++ b/frontend/package.json
@@ -0,0 +1,21 @@
+{
+  "name": "shikhar-wellness-crm-frontend",
+  "version": "1.0.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "dev": "vite",
+    "build": "vite build",
+    "preview": "vite preview"
+  },
+  "dependencies": {
+    "axios": "^1.7.3",
+    "react": "^18.3.1",
+    "react-dom": "^18.3.1",
+    "react-router-dom": "^6.26.2"
+  },
+  "devDependencies": {
+    "@vitejs/plugin-react": "^4.3.1",
+    "vite": "^5.4.0"
+  }
+}
diff --git a/frontend/public/icons/icon-192.png b/frontend/public/icons/icon-192.png
new file mode 100644
index 0000000000000000000000000000000000000000..fef19157c73d7e7763f2fc9f82c129fe0bae6fd3
GIT binary patch
literal 67
zcmeAS@N?(olHy`uVBq!ia0vp^j3CUx0wlM}@Gt=>Zci7-kcv6UAQ@H$MqV!6EkIEQ
MPgg&ebxsLQ05A^<U;qFB

literal 0
HcmV?d00001

diff --git a/frontend/public/icons/icon-192.svg b/frontend/public/icons/icon-192.svg
new file mode 100644
index 0000000000000000000000000000000000000000..9d4f4ab2d9eb5170506b88e60910a2b342d5a63b
--- /dev/null
+++ b/frontend/public/icons/icon-192.svg
@@ -0,0 +1,10 @@
+<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
+  <defs>
+    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
+      <stop offset="0%" stop-color="#0f172a" />
+      <stop offset="100%" stop-color="#2563eb" />
+    </linearGradient>
+  </defs>
+  <rect width="192" height="192" rx="32" fill="url(#bg)" />
+  <text x="50%" y="54%" text-anchor="middle" fill="#ffffff" font-size="72" font-family="Arial, sans-serif">S</text>
+</svg>
diff --git a/frontend/public/icons/icon-512.png b/frontend/public/icons/icon-512.png
new file mode 100644
index 0000000000000000000000000000000000000000..fef19157c73d7e7763f2fc9f82c129fe0bae6fd3
GIT binary patch
literal 67
zcmeAS@N?(olHy`uVBq!ia0vp^j3CUx0wlM}@Gt=>Zci7-kcv6UAQ@H$MqV!6EkIEQ
MPgg&ebxsLQ05A^<U;qFB

literal 0
HcmV?d00001

diff --git a/frontend/public/icons/icon-512.svg b/frontend/public/icons/icon-512.svg
new file mode 100644
index 0000000000000000000000000000000000000000..9cd73550938b07a86b1d865ee98897ea665e7598
--- /dev/null
+++ b/frontend/public/icons/icon-512.svg
@@ -0,0 +1,10 @@
+<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
+  <defs>
+    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
+      <stop offset="0%" stop-color="#0f172a" />
+      <stop offset="100%" stop-color="#2563eb" />
+    </linearGradient>
+  </defs>
+  <rect width="512" height="512" rx="96" fill="url(#bg)" />
+  <text x="50%" y="54%" text-anchor="middle" fill="#ffffff" font-size="200" font-family="Arial, sans-serif">S</text>
+</svg>
diff --git a/frontend/public/manifest.json b/frontend/public/manifest.json
new file mode 100644
index 0000000000000000000000000000000000000000..b1965557498432a3da035dcf60e61a1d977a6609
--- /dev/null
+++ b/frontend/public/manifest.json
@@ -0,0 +1,20 @@
+{
+  "name": "Shikhar Wellness CRM",
+  "short_name": "ShikharCRM",
+  "start_url": "/",
+  "display": "standalone",
+  "background_color": "#f8fafc",
+  "theme_color": "#0f172a",
+  "icons": [
+    {
+      "src": "/icons/icon-192.svg",
+      "sizes": "192x192",
+      "type": "image/svg+xml"
+    },
+    {
+      "src": "/icons/icon-512.svg",
+      "sizes": "512x512",
+      "type": "image/svg+xml"
+    }
+  ]
+}
diff --git a/frontend/public/sw.js b/frontend/public/sw.js
new file mode 100644
index 0000000000000000000000000000000000000000..87e334b02000bab3c7c3a9422767dd86b305ef19
--- /dev/null
+++ b/frontend/public/sw.js
@@ -0,0 +1,11 @@
+self.addEventListener("install", (event) => {
+  event.waitUntil(
+    caches.open("shikhar-crm-v1").then((cache) => cache.addAll(["/"]))
+  );
+});
+
+self.addEventListener("fetch", (event) => {
+  event.respondWith(
+    caches.match(event.request).then((response) => response || fetch(event.request))
+  );
+});
diff --git a/frontend/src/App.jsx b/frontend/src/App.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..d05ebf18a3276bc10646627738a3187b2f0f9c43
--- /dev/null
+++ b/frontend/src/App.jsx
@@ -0,0 +1,25 @@
+import { Route, Routes } from "react-router-dom";
+import AppLayout from "./layouts/AppLayout";
+import Login from "./pages/Login";
+import AdminDashboard from "./pages/AdminDashboard";
+import AgentDashboard from "./pages/AgentDashboard";
+import Leads from "./pages/Leads";
+import Orders from "./pages/Orders";
+import Products from "./pages/Products";
+import Reports from "./pages/Reports";
+
+const App = () => (
+  <Routes>
+    <Route path="/" element={<Login />} />
+    <Route element={<AppLayout />}>
+      <Route path="/admin" element={<AdminDashboard />} />
+      <Route path="/agent" element={<AgentDashboard />} />
+      <Route path="/leads" element={<Leads />} />
+      <Route path="/orders" element={<Orders />} />
+      <Route path="/products" element={<Products />} />
+      <Route path="/reports" element={<Reports />} />
+    </Route>
+  </Routes>
+);
+
+export default App;
diff --git a/frontend/src/layouts/AppLayout.jsx b/frontend/src/layouts/AppLayout.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..4777c961c6320b1a82b2a07c6a410f49c0000c3e
--- /dev/null
+++ b/frontend/src/layouts/AppLayout.jsx
@@ -0,0 +1,25 @@
+import { NavLink, Outlet } from "react-router-dom";
+
+const AppLayout = () => (
+  <div className="app-shell">
+    <aside className="sidebar">
+      <div className="brand">
+        <h1>Shikhar Wellness CRM</h1>
+        <p>Admin & Agent Workspace</p>
+      </div>
+      <nav className="nav">
+        <NavLink to="/admin">Admin Dashboard</NavLink>
+        <NavLink to="/agent">Agent Panel</NavLink>
+        <NavLink to="/leads">Leads</NavLink>
+        <NavLink to="/orders">Orders</NavLink>
+        <NavLink to="/products">Products</NavLink>
+        <NavLink to="/reports">Reports</NavLink>
+      </nav>
+    </aside>
+    <main className="content">
+      <Outlet />
+    </main>
+  </div>
+);
+
+export default AppLayout;
diff --git a/frontend/src/main.jsx b/frontend/src/main.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..5da63f50e481f3bd2efd0db8c09f2a09ac058a93
--- /dev/null
+++ b/frontend/src/main.jsx
@@ -0,0 +1,19 @@
+import React from "react";
+import ReactDOM from "react-dom/client";
+import { BrowserRouter } from "react-router-dom";
+import App from "./App";
+import "./styles/global.css";
+
+ReactDOM.createRoot(document.getElementById("root")).render(
+  <React.StrictMode>
+    <BrowserRouter>
+      <App />
+    </BrowserRouter>
+  </React.StrictMode>
+);
+
+if ("serviceWorker" in navigator) {
+  window.addEventListener("load", () => {
+    navigator.serviceWorker.register("/sw.js");
+  });
+}
diff --git a/frontend/src/pages/AdminDashboard.jsx b/frontend/src/pages/AdminDashboard.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..cabbadfee9ce09dafba5e053ffef105afdfbd8f4
--- /dev/null
+++ b/frontend/src/pages/AdminDashboard.jsx
@@ -0,0 +1,31 @@
+const AdminDashboard = () => (
+  <section>
+    <header className="page-header">
+      <div>
+        <h2>Admin Dashboard</h2>
+        <p>Track daily sales, agent productivity, and stock alerts.</p>
+      </div>
+      <button className="primary">Create Agent</button>
+    </header>
+    <div className="grid">
+      <div className="card">
+        <h3>Daily Sales</h3>
+        <p className="metric">₹ 1,25,000</p>
+        <span className="muted">Auto-refresh every 30 min</span>
+      </div>
+      <div className="card">
+        <h3>Low Stock Alerts</h3>
+        <ul>
+          <li>Herbal Vitality Capsules (5 left)</li>
+          <li>Energy Booster Tonic (8 left)</li>
+        </ul>
+      </div>
+      <div className="card">
+        <h3>Agent Performance</h3>
+        <p>Top agent: Aarav (38 conversions)</p>
+      </div>
+    </div>
+  </section>
+);
+
+export default AdminDashboard;
diff --git a/frontend/src/pages/AgentDashboard.jsx b/frontend/src/pages/AgentDashboard.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..37aa1dc8ae07c3a17f8f9656a63913e4d5c75672
--- /dev/null
+++ b/frontend/src/pages/AgentDashboard.jsx
@@ -0,0 +1,30 @@
+const AgentDashboard = () => (
+  <section>
+    <header className="page-header">
+      <div>
+        <h2>Agent Panel</h2>
+        <p>Follow up on assigned leads and update order statuses.</p>
+      </div>
+      <button className="secondary">Start Call Session</button>
+    </header>
+    <div className="grid">
+      <div className="card">
+        <h3>My Leads</h3>
+        <p className="metric">24 Active</p>
+      </div>
+      <div className="card">
+        <h3>Today's Follow-ups</h3>
+        <ul>
+          <li>Rohit - Hot - 11:00 AM</li>
+          <li>Vijaya - Follow-up - 2:30 PM</li>
+        </ul>
+      </div>
+      <div className="card">
+        <h3>Orders in Transit</h3>
+        <p>12 Packed · 6 Shipped · 2 OFD</p>
+      </div>
+    </div>
+  </section>
+);
+
+export default AgentDashboard;
diff --git a/frontend/src/pages/Leads.jsx b/frontend/src/pages/Leads.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..3437cded33f235b65daf15e7e4d88b1a6a7369f1
--- /dev/null
+++ b/frontend/src/pages/Leads.jsx
@@ -0,0 +1,73 @@
+const Leads = () => (
+  <section>
+    <header className="page-header">
+      <div>
+        <h2>Lead Management</h2>
+        <p>Create, assign, and track lead status.</p>
+      </div>
+      <button className="primary">Auto-Assign</button>
+    </header>
+    <div className="grid two-column">
+      <div className="card">
+        <h3>Create Lead</h3>
+        <form className="form">
+          <label>
+            Name
+            <input placeholder="Customer name" />
+          </label>
+          <label>
+            Phone
+            <input placeholder="Phone number" />
+          </label>
+          <label>
+            Source
+            <input placeholder="Facebook, WhatsApp, Referral" />
+          </label>
+          <label>
+            Status
+            <select>
+              <option>New</option>
+              <option>Follow-up</option>
+              <option>Hot</option>
+              <option>Converted</option>
+              <option>Dead</option>
+            </select>
+          </label>
+          <label>
+            Notes
+            <textarea placeholder="Lead notes" rows="3"></textarea>
+          </label>
+          <button type="button">Save Lead</button>
+        </form>
+      </div>
+      <div className="card">
+        <h3>Latest Leads</h3>
+        <ul className="list">
+          <li>
+            <div>
+              <strong>Ritika Sharma</strong>
+              <span className="muted">Facebook · New</span>
+            </div>
+            <span className="pill">Unassigned</span>
+          </li>
+          <li>
+            <div>
+              <strong>Rahul Mehta</strong>
+              <span className="muted">WhatsApp · Hot</span>
+            </div>
+            <span className="pill success">Agent: Neha</span>
+          </li>
+          <li>
+            <div>
+              <strong>Ajay Singh</strong>
+              <span className="muted">Referral · Follow-up</span>
+            </div>
+            <span className="pill warning">Follow-up</span>
+          </li>
+        </ul>
+      </div>
+    </div>
+  </section>
+);
+
+export default Leads;
diff --git a/frontend/src/pages/Login.jsx b/frontend/src/pages/Login.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..fa13aba329f5390603d790fb7e02315492ac59fa
--- /dev/null
+++ b/frontend/src/pages/Login.jsx
@@ -0,0 +1,37 @@
+import { useState } from "react";
+
+const Login = () => {
+  const [form, setForm] = useState({ email: "", password: "" });
+
+  const handleChange = (event) => {
+    setForm({ ...form, [event.target.name]: event.target.value });
+  };
+
+  return (
+    <div className="auth-container">
+      <div className="auth-card">
+        <h2>Welcome to Shikhar Wellness CRM</h2>
+        <p>Sign in to manage leads, orders, and inventory.</p>
+        <form className="form">
+          <label>
+            Email
+            <input name="email" value={form.email} onChange={handleChange} placeholder="admin@shikharwellness.com" />
+          </label>
+          <label>
+            Password
+            <input
+              type="password"
+              name="password"
+              value={form.password}
+              onChange={handleChange}
+              placeholder="••••••••"
+            />
+          </label>
+          <button type="button">Login</button>
+        </form>
+      </div>
+    </div>
+  );
+};
+
+export default Login;
diff --git a/frontend/src/pages/Orders.jsx b/frontend/src/pages/Orders.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..8e37e415b8d27c188f2a0494650e3e5245729f00
--- /dev/null
+++ b/frontend/src/pages/Orders.jsx
@@ -0,0 +1,105 @@
+const Orders = () => (
+  <section>
+    <header className="page-header">
+      <div>
+        <h2>Order Management</h2>
+        <p>Create orders with precise address mapping and payment tracking.</p>
+      </div>
+      <button className="primary">New Order</button>
+    </header>
+    <div className="grid two-column">
+      <div className="card">
+        <h3>Order Form</h3>
+        <form className="form">
+          <label>
+            Customer Name
+            <input placeholder="Full name" />
+          </label>
+          <label>
+            Phone Number
+            <input placeholder="Phone" />
+          </label>
+          <label>
+            Address Search (Google Places)
+            <input placeholder="Search address" />
+          </label>
+          <div className="map-placeholder">
+            <p>Map preview with pin location</p>
+            <span>Latitude / Longitude auto-filled here</span>
+          </div>
+          <div className="grid">
+            <label>
+              City
+              <input placeholder="City" />
+            </label>
+            <label>
+              State
+              <input placeholder="State" />
+            </label>
+            <label>
+              Pincode
+              <input placeholder="Pincode" />
+            </label>
+          </div>
+          <label>
+            Products
+            <select>
+              <option>Herbal Vitality Capsules</option>
+              <option>Energy Booster Tonic</option>
+            </select>
+          </label>
+          <div className="grid">
+            <label>
+              Quantity
+              <input type="number" placeholder="1" />
+            </label>
+            <label>
+              Price
+              <input type="number" placeholder="1499" />
+            </label>
+            <label>
+              Discount
+              <input type="number" placeholder="0" />
+            </label>
+          </div>
+          <label>
+            Payment Mode
+            <select>
+              <option>COD</option>
+              <option>Online</option>
+            </select>
+          </label>
+          <button type="button">Confirm Order</button>
+        </form>
+      </div>
+      <div className="card">
+        <h3>Recent Orders</h3>
+        <ul className="list">
+          <li>
+            <div>
+              <strong>#SW-1098</strong>
+              <span className="muted">Packed · COD</span>
+            </div>
+            <span className="pill">₹ 1,499</span>
+          </li>
+          <li>
+            <div>
+              <strong>#SW-1097</strong>
+              <span className="muted">Shipped · Online</span>
+            </div>
+            <span className="pill success">₹ 2,999</span>
+          </li>
+          <li>
+            <div>
+              <strong>#SW-1096</strong>
+              <span className="muted">OFD · COD</span>
+            </div>
+            <span className="pill warning">₹ 1,999</span>
+          </li>
+        </ul>
+      </div>
+    </div>
+  </section>
+);
+
+export default Orders;
diff --git a/frontend/src/pages/Products.jsx b/frontend/src/pages/Products.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..7eb7a3df3df14b0c36143f67d8ec2fcbaaf6dde4
--- /dev/null
+++ b/frontend/src/pages/Products.jsx
@@ -0,0 +1,44 @@
+const Products = () => (
+  <section>
+    <header className="page-header">
+      <div>
+        <h2>Products & Inventory</h2>
+        <p>Manage product catalogue and stock levels.</p>
+      </div>
+      <button className="primary">Add Product</button>
+    </header>
+    <div className="grid two-column">
+      <div className="card">
+        <h3>Product List</h3>
+        <ul className="list">
+          <li>
+            <div>
+              <strong>Herbal Vitality Capsules</strong>
+              <span className="muted">MRP ₹1999 · Selling ₹1499</span>
+            </div>
+            <span className="pill">Stock: 42</span>
+          </li>
+          <li>
+            <div>
+              <strong>Energy Booster Tonic</strong>
+              <span className="muted">MRP ₹1499 · Selling ₹1199</span>
+            </div>
+            <span className="pill warning">Stock: 8</span>
+          </li>
+        </ul>
+      </div>
+      <div className="card">
+        <h3>Stock Alerts</h3>
+        <p>Configure low stock thresholds and replenishment reminders.</p>
+        <div className="alert">
+          <strong>Low Stock:</strong> Energy Booster Tonic (8 units).
+        </div>
+        <div className="alert">
+          <strong>Pending PO:</strong> Herbal Vitality Capsules (ETA 3 days).
+        </div>
+      </div>
+    </div>
+  </section>
+);
+
+export default Products;
diff --git a/frontend/src/pages/Reports.jsx b/frontend/src/pages/Reports.jsx
new file mode 100644
index 0000000000000000000000000000000000000000..105283ad62868a7c792b6c5149b11b3af7430cc2
--- /dev/null
+++ b/frontend/src/pages/Reports.jsx
@@ -0,0 +1,32 @@
+const Reports = () => (
+  <section>
+    <header className="page-header">
+      <div>
+        <h2>Reports & Analytics</h2>
+        <p>Download Excel reports for sales, agent performance, and RTO rate.</p>
+      </div>
+      <button className="secondary">Export to Excel</button>
+    </header>
+    <div className="grid">
+      <div className="card">
+        <h3>Daily Sales</h3>
+        <p className="metric">₹ 4.7L</p>
+        <span className="muted">Compared to yesterday +12%</span>
+      </div>
+      <div className="card">
+        <h3>Product-wise Sales</h3>
+        <ul>
+          <li>Herbal Vitality Capsules - 280 units</li>
+          <li>Energy Booster Tonic - 190 units</li>
+        </ul>
+      </div>
+      <div className="card">
+        <h3>RTO Percentage</h3>
+        <p className="metric">6.2%</p>
+        <span className="muted">Goal under 8%</span>
+      </div>
+    </div>
+  </section>
+);
+
+export default Reports;
diff --git a/frontend/src/services/api.js b/frontend/src/services/api.js
new file mode 100644
index 0000000000000000000000000000000000000000..37daff461f3a00f9b779c52d7ee2840c76ecbc0a
--- /dev/null
+++ b/frontend/src/services/api.js
@@ -0,0 +1,15 @@
+import axios from "axios";
+
+const api = axios.create({
+  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
+});
+
+api.interceptors.request.use((config) => {
+  const token = localStorage.getItem("token");
+  if (token) {
+    config.headers.Authorization = `Bearer ${token}`;
+  }
+  return config;
+});
+
+export default api;
diff --git a/frontend/src/styles/global.css b/frontend/src/styles/global.css
new file mode 100644
index 0000000000000000000000000000000000000000..60451b071b3e13adab17693c0e25274ca0675d29
--- /dev/null
+++ b/frontend/src/styles/global.css
@@ -0,0 +1,228 @@
+:root {
+  color-scheme: light;
+  font-family: "Inter", system-ui, sans-serif;
+  line-height: 1.5;
+  font-weight: 400;
+  color: #0f172a;
+  background-color: #f8fafc;
+}
+
+* {
+  box-sizing: border-box;
+}
+
+body {
+  margin: 0;
+  background: #f8fafc;
+}
+
+a {
+  text-decoration: none;
+  color: inherit;
+}
+
+.app-shell {
+  display: flex;
+  min-height: 100vh;
+}
+
+.sidebar {
+  width: 260px;
+  background: #0f172a;
+  color: #e2e8f0;
+  padding: 24px;
+  display: flex;
+  flex-direction: column;
+  gap: 24px;
+}
+
+.brand h1 {
+  font-size: 20px;
+  margin: 0;
+}
+
+.brand p {
+  margin: 4px 0 0;
+  font-size: 12px;
+  color: #94a3b8;
+}
+
+.nav {
+  display: flex;
+  flex-direction: column;
+  gap: 12px;
+}
+
+.nav a {
+  padding: 10px 12px;
+  border-radius: 8px;
+  color: #e2e8f0;
+}
+
+.nav a.active,
+.nav a:hover {
+  background: #1e293b;
+}
+
+.content {
+  flex: 1;
+  padding: 32px;
+}
+
+.auth-container {
+  min-height: 100vh;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  background: linear-gradient(135deg, #dbeafe, #fef9c3);
+}
+
+.auth-card {
+  background: #ffffff;
+  padding: 32px;
+  border-radius: 16px;
+  max-width: 420px;
+  width: 100%;
+  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
+}
+
+.auth-card h2 {
+  margin: 0 0 8px;
+}
+
+.form {
+  display: grid;
+  gap: 16px;
+  margin-top: 20px;
+}
+
+.form label {
+  display: grid;
+  gap: 8px;
+  font-size: 14px;
+  color: #334155;
+}
+
+input,
+select,
+textarea {
+  border: 1px solid #cbd5f5;
+  border-radius: 8px;
+  padding: 10px 12px;
+  font-size: 14px;
+  outline: none;
+}
+
+button {
+  border: none;
+  padding: 12px 16px;
+  border-radius: 8px;
+  background: #0ea5e9;
+  color: white;
+  font-weight: 600;
+  cursor: pointer;
+}
+
+button.secondary {
+  background: #f59e0b;
+}
+
+button.primary {
+  background: #2563eb;
+}
+
+.page-header {
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+  gap: 16px;
+  margin-bottom: 24px;
+}
+
+.grid {
+  display: grid;
+  gap: 20px;
+}
+
+.two-column {
+  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
+}
+
+.card {
+  background: #ffffff;
+  padding: 20px;
+  border-radius: 16px;
+  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
+}
+
+.metric {
+  font-size: 28px;
+  font-weight: 700;
+  margin: 8px 0;
+}
+
+.muted {
+  color: #64748b;
+  font-size: 13px;
+}
+
+.list {
+  list-style: none;
+  padding: 0;
+  margin: 0;
+  display: grid;
+  gap: 12px;
+}
+
+.list li {
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+  gap: 12px;
+  padding: 12px 14px;
+  border-radius: 12px;
+  background: #f8fafc;
+}
+
+.pill {
+  padding: 6px 10px;
+  border-radius: 999px;
+  background: #e2e8f0;
+  font-size: 12px;
+}
+
+.pill.success {
+  background: #dcfce7;
+  color: #15803d;
+}
+
+.pill.warning {
+  background: #fef3c7;
+  color: #b45309;
+}
+
+.map-placeholder {
+  border: 1px dashed #94a3b8;
+  padding: 16px;
+  border-radius: 12px;
+  text-align: center;
+  color: #475569;
+  background: #f8fafc;
+}
+
+.alert {
+  margin-top: 12px;
+  padding: 12px 14px;
+  border-radius: 12px;
+  background: #f1f5f9;
+}
+
+@media (max-width: 960px) {
+  .app-shell {
+    flex-direction: column;
+  }
+
+  .sidebar {
+    width: 100%;
+  }
+}
diff --git a/frontend/vite.config.js b/frontend/vite.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..43a400237708bd783b30c8fa120c36b565f4c99d
--- /dev/null
+++ b/frontend/vite.config.js
@@ -0,0 +1,9 @@
+import { defineConfig } from "vite";
+import react from "@vitejs/plugin-react";
+
+export default defineConfig({
+  plugins: [react()],
+  server: {
+    port: 5173,
+  },
+});
 
EOF
)
