import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Array "mo:core/Array";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import Stripe "stripe/stripe";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    email : Text;
  };

  // Custom Types
  public type Business = {
    id : Nat;
    owner : Principal;
    name : Text;
    gstin : Text;
    state : Text;
    address : Text;
    createdAt : Time.Time;
  };

  public type Customer = {
    id : Nat;
    businessId : Nat;
    name : Text;
    gstin : Text;
    phone : Text;
    email : Text;
    address : Text;
    createdAt : Time.Time;
  };

  public type Vendor = {
    id : Nat;
    businessId : Nat;
    name : Text;
    gstin : Text;
    phone : Text;
    email : Text;
    address : Text;
    createdAt : Time.Time;
  };

  public type Product = {
    id : Nat;
    businessId : Nat;
    name : Text;
    hsnCode : Text;
    gstRate : Nat;
    purchasePrice : Nat;
    sellingPrice : Nat;
    stockQuantity : Nat;
    createdAt : Time.Time;
  };

  public type Invoice = {
    id : Nat;
    businessId : Nat;
    customerId : Nat;
    invoiceNumber : Text;
    invoiceDate : Time.Time;
    dueDate : Time.Time;
    subtotal : Nat;
    cgst : Nat;
    sgst : Nat;
    igst : Nat;
    totalAmount : Nat;
    status : InvoiceStatus;
    createdAt : Time.Time;
  };

  public type InvoiceItem = {
    id : Nat;
    invoiceId : Nat;
    productId : Nat;
    productName : Text;
    quantity : Nat;
    price : Nat;
    gstRate : Nat;
    total : Nat;
  };

  public type Expense = {
    id : Nat;
    businessId : Nat;
    vendorId : ?Nat;
    category : Text;
    amount : Nat;
    gstAmount : Nat;
    expenseDate : Time.Time;
    description : Text;
    createdAt : Time.Time;
  };

  public type Payment = {
    id : Nat;
    invoiceId : Nat;
    amount : Nat;
    paymentDate : Time.Time;
    paymentMode : Text;
    referenceNo : Text;
    createdAt : Time.Time;
  };

  public type GstReport = {
    id : Nat;
    businessId : Nat;
    periodStart : Time.Time;
    periodEnd : Time.Time;
    outputGst : Nat;
    inputGst : Nat;
    netGstPayable : Nat;
    createdAt : Time.Time;
  };

  public type InvoiceStatus = {
    #draft;
    #sent;
    #paid;
    #overdue;
  };

  public type SubscriptionTier = {
    #free;
    #paid;
  };

  public type SubscriptionStatus = {
    tier : SubscriptionTier;
    invoiceCount : Nat;
    customerCount : Nat;
    productCount : Nat;
  };
  public type DashboardData = {
    totalReceivables : Nat;
    totalPayables : Nat;
    currentMonthOutputGst : Nat;
    currentMonthInputGst : Nat;
    netGstPayable : Nat;
    overdueInvoiceCount : Nat;
    recentInvoices : [Invoice];
  };

  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Storage Maps
  let userProfiles = Map.empty<Principal, UserProfile>();
  let businesses = Map.empty<Nat, Business>();
  let customers = Map.empty<Nat, Customer>();
  let vendors = Map.empty<Nat, Vendor>();
  let products = Map.empty<Nat, Product>();
  let invoices = Map.empty<Nat, Invoice>();
  let invoiceItems = Map.empty<Nat, InvoiceItem>();
  let expenses = Map.empty<Nat, Expense>();
  let payments = Map.empty<Nat, Payment>();
  let gstReports = Map.empty<Nat, GstReport>();
  let userSubscriptions = Map.empty<Principal, SubscriptionTier>();

  // ID Counters
  var businessIdCounter = 1;
  var customerIdCounter = 1;
  var vendorIdCounter = 1;
  var productIdCounter = 1;
  var invoiceIdCounter = 1;
  var invoiceItemIdCounter = 1;
  var expenseIdCounter = 1;
  var paymentIdCounter = 1;
  var gstReportIdCounter = 1;

  // Helper function to verify business ownership
  func verifyBusinessOwnership(caller : Principal, businessId : Nat) : Business {
    let business = switch (businesses.get(businessId)) {
      case (null) { Runtime.trap("Business not found") };
      case (?b) { b };
    };

    if (business.owner != caller) {
      Runtime.trap("Unauthorized: You do not own this business");
    };

    business;
  };

  // Stripe
  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can configure Stripe");
    };
    stripeConfig := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?config) { config };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { await Stripe.getSessionStatus(value, sessionId, transform) };
    };
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { await Stripe.createCheckoutSession(value, caller, items, successUrl, cancelUrl, transform) };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // User Profile Operations
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Business Operations
  public shared ({ caller }) func createBusiness(name : Text, gstin : Text, state : Text, address : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create businesses");
    };

    let business : Business = {
      id = businessIdCounter;
      owner = caller;
      name;
      gstin;
      state;
      address;
      createdAt = Time.now();
    };

    businesses.add(businessIdCounter, business);
    businessIdCounter += 1;
    businessIdCounter - 1;
  };

  public query ({ caller }) func getMyBusinesses() : async [Business] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their businesses");
    };

    businesses.values().toArray().filter(
      func(b) { b.owner == caller }
    );
  };

  public query ({ caller }) func getBusiness(id : Nat) : async Business {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view businesses");
    };

    let business = switch (businesses.get(id)) {
      case (null) { Runtime.trap("Business not found") };
      case (?b) { b };
    };

    if (business.owner != caller) {
      Runtime.trap("Unauthorized: You do not own this business");
    };

    business;
  };

  public shared ({ caller }) func updateBusiness(id : Nat, name : Text, gstin : Text, state : Text, address : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update businesses");
    };

    let business = verifyBusinessOwnership(caller, id);

    let updatedBusiness = { business with name; gstin; state; address };
    businesses.add(id, updatedBusiness);
  };

  public shared ({ caller }) func deleteBusiness(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete businesses");
    };

    let _ = verifyBusinessOwnership(caller, id);
    businesses.remove(id);
  };

  // Customer Operations
  public shared ({ caller }) func createCustomer(businessId : Nat, name : Text, gstin : Text, phone : Text, email : Text, address : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create customers");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    let customer : Customer = {
      id = customerIdCounter;
      businessId;
      name;
      gstin;
      phone;
      email;
      address;
      createdAt = Time.now();
    };

    customers.add(customerIdCounter, customer);
    customerIdCounter += 1;
    customerIdCounter - 1;
  };

  public query ({ caller }) func getCustomers(businessId : Nat) : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    customers.values().toArray().filter(
      func(c) { c.businessId == businessId }
    );
  };

  public query ({ caller }) func getCustomer(id : Nat) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };

    let customer = switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    let _ = verifyBusinessOwnership(caller, customer.businessId);
    customer;
  };

  public shared ({ caller }) func updateCustomer(id : Nat, name : Text, gstin : Text, phone : Text, email : Text, address : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update customers");
    };

    let customer = switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    let _ = verifyBusinessOwnership(caller, customer.businessId);

    let updatedCustomer = { customer with name; gstin; phone; email; address };
    customers.add(id, updatedCustomer);
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete customers");
    };

    let customer = switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    let _ = verifyBusinessOwnership(caller, customer.businessId);
    customers.remove(id);
  };

  // Vendor Operations
  public shared ({ caller }) func createVendor(businessId : Nat, name : Text, gstin : Text, phone : Text, email : Text, address : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create vendors");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    let vendor : Vendor = {
      id = vendorIdCounter;
      businessId;
      name;
      gstin;
      phone;
      email;
      address;
      createdAt = Time.now();
    };

    vendors.add(vendorIdCounter, vendor);
    vendorIdCounter += 1;
    vendorIdCounter - 1;
  };

  public query ({ caller }) func getVendors(businessId : Nat) : async [Vendor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vendors");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    vendors.values().toArray().filter(
      func(v) { v.businessId == businessId }
    );
  };

  public query ({ caller }) func getVendor(id : Nat) : async Vendor {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vendors");
    };

    let vendor = switch (vendors.get(id)) {
      case (null) { Runtime.trap("Vendor not found") };
      case (?v) { v };
    };

    let _ = verifyBusinessOwnership(caller, vendor.businessId);
    vendor;
  };

  public shared ({ caller }) func updateVendor(id : Nat, name : Text, gstin : Text, phone : Text, email : Text, address : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update vendors");
    };

    let vendor = switch (vendors.get(id)) {
      case (null) { Runtime.trap("Vendor not found") };
      case (?v) { v };
    };

    let _ = verifyBusinessOwnership(caller, vendor.businessId);

    let updatedVendor = { vendor with name; gstin; phone; email; address };
    vendors.add(id, updatedVendor);
  };

  public shared ({ caller }) func deleteVendor(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete vendors");
    };

    let vendor = switch (vendors.get(id)) {
      case (null) { Runtime.trap("Vendor not found") };
      case (?v) { v };
    };

    let _ = verifyBusinessOwnership(caller, vendor.businessId);
    vendors.remove(id);
  };

  // Product Operations
  public shared ({ caller }) func createProduct(businessId : Nat, name : Text, hsnCode : Text, gstRate : Nat, purchasePrice : Nat, sellingPrice : Nat, stockQuantity : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create products");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    let product : Product = {
      id = productIdCounter;
      businessId;
      name;
      hsnCode;
      gstRate;
      purchasePrice;
      sellingPrice;
      stockQuantity;
      createdAt = Time.now();
    };

    products.add(productIdCounter, product);
    productIdCounter += 1;
    productIdCounter - 1;
  };

  public query ({ caller }) func getProducts(businessId : Nat) : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    products.values().toArray().filter(
      func(p) { p.businessId == businessId }
    );
  };

  public query ({ caller }) func getProduct(id : Nat) : async Product {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };

    let product = switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };

    let _ = verifyBusinessOwnership(caller, product.businessId);
    product;
  };

  public shared ({ caller }) func updateProduct(id : Nat, name : Text, hsnCode : Text, gstRate : Nat, purchasePrice : Nat, sellingPrice : Nat, stockQuantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update products");
    };

    let product = switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };

    let _ = verifyBusinessOwnership(caller, product.businessId);

    let updatedProduct = {
      product with name;
      hsnCode;
      gstRate;
      purchasePrice;
      sellingPrice;
      stockQuantity;
    };
    products.add(id, updatedProduct);
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete products");
    };

    let product = switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };

    let _ = verifyBusinessOwnership(caller, product.businessId);
    products.remove(id);
  };

  // Invoice Operations
  public shared ({ caller }) func createInvoice(
    businessId : Nat,
    customerId : Nat,
    invoiceNumber : Text,
    invoiceDate : Time.Time,
    dueDate : Time.Time,
    items : [(Nat, Text, Nat, Nat, Nat)],
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create invoices");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    var subtotal = 0;
    var cgst = 0;
    var sgst = 0;
    var igst = 0;

    for ((productId, productName, quantity, price, gstRate) in items.vals()) {
      let itemTotal = quantity * price;
      subtotal += itemTotal;
      let gstAmount = (itemTotal * gstRate) / 100;
      cgst += gstAmount / 2;
      sgst += gstAmount / 2;
    };

    let totalAmount = subtotal + cgst + sgst + igst;

    let invoice : Invoice = {
      id = invoiceIdCounter;
      businessId;
      customerId;
      invoiceNumber;
      invoiceDate;
      dueDate;
      subtotal;
      cgst;
      sgst;
      igst;
      totalAmount;
      status = #draft;
      createdAt = Time.now();
    };

    invoices.add(invoiceIdCounter, invoice);

    for ((productId, productName, quantity, price, gstRate) in items.vals()) {
      let item : InvoiceItem = {
        id = invoiceItemIdCounter;
        invoiceId = invoiceIdCounter;
        productId;
        productName;
        quantity;
        price;
        gstRate;
        total = quantity * price;
      };
      invoiceItems.add(invoiceItemIdCounter, item);
      invoiceItemIdCounter += 1;
    };

    invoiceIdCounter += 1;
    invoiceIdCounter - 1;
  };

  public query ({ caller }) func getInvoices(businessId : Nat) : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    invoices.values().toArray().filter(
      func(i) { i.businessId == businessId }
    );
  };

  public query ({ caller }) func getInvoice(id : Nat) : async Invoice {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };

    let invoice = switch (invoices.get(id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?i) { i };
    };

    let _ = verifyBusinessOwnership(caller, invoice.businessId);
    invoice;
  };

  public shared ({ caller }) func updateInvoiceStatus(id : Nat, status : InvoiceStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update invoices");
    };

    let invoice = switch (invoices.get(id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?i) { i };
    };

    let _ = verifyBusinessOwnership(caller, invoice.businessId);

    let updatedInvoice = { invoice with status };
    invoices.add(id, updatedInvoice);
  };

  public shared ({ caller }) func addPaymentToInvoice(invoiceId : Nat, amount : Nat, paymentDate : Time.Time, paymentMode : Text, referenceNo : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add payments");
    };

    let invoice = switch (invoices.get(invoiceId)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?i) { i };
    };

    let _ = verifyBusinessOwnership(caller, invoice.businessId);

    let payment : Payment = {
      id = paymentIdCounter;
      invoiceId;
      amount;
      paymentDate;
      paymentMode;
      referenceNo;
      createdAt = Time.now();
    };

    payments.add(paymentIdCounter, payment);
    paymentIdCounter += 1;
    paymentIdCounter - 1;
  };

  public query ({ caller }) func getOverdueInvoices(businessId : Nat) : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    invoices.values().toArray().filter(
      func(i) { i.businessId == businessId and i.status == #overdue }
    );
  };

  public shared ({ caller }) func deleteInvoice(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete invoices");
    };

    let invoice = switch (invoices.get(id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?i) { i };
    };

    let _ = verifyBusinessOwnership(caller, invoice.businessId);
    invoices.remove(id);
  };

  // Expense Operations
  public shared ({ caller }) func createExpense(businessId : Nat, vendorId : ?Nat, category : Text, amount : Nat, gstAmount : Nat, expenseDate : Time.Time, description : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create expenses");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    let expense : Expense = {
      id = expenseIdCounter;
      businessId;
      vendorId;
      category;
      amount;
      gstAmount;
      expenseDate;
      description;
      createdAt = Time.now();
    };

    expenses.add(expenseIdCounter, expense);
    expenseIdCounter += 1;
    expenseIdCounter - 1;
  };

  public query ({ caller }) func getExpenses(businessId : Nat) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    expenses.values().toArray().filter(
      func(e) { e.businessId == businessId }
    );
  };

  public query ({ caller }) func getExpense(id : Nat) : async Expense {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };

    let expense = switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense not found") };
      case (?e) { e };
    };

    let _ = verifyBusinessOwnership(caller, expense.businessId);
    expense;
  };

  public shared ({ caller }) func updateExpense(id : Nat, category : Text, amount : Nat, gstAmount : Nat, expenseDate : Time.Time, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update expenses");
    };

    let expense = switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense not found") };
      case (?e) { e };
    };

    let _ = verifyBusinessOwnership(caller, expense.businessId);

    let updatedExpense = { expense with category; amount; gstAmount; expenseDate; description };
    expenses.add(id, updatedExpense);
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };

    let expense = switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense not found") };
      case (?e) { e };
    };

    let _ = verifyBusinessOwnership(caller, expense.businessId);
    expenses.remove(id);
  };

  // GST Report Operations
  public shared ({ caller }) func generateGstReport(businessId : Nat, periodStart : Time.Time, periodEnd : Time.Time) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate GST reports");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    var outputGst = 0;
    var inputGst = 0;

    for (invoice in invoices.values()) {
      if (invoice.businessId == businessId and (invoice.status == #paid or invoice.status == #sent)) {
        if (invoice.invoiceDate >= periodStart and invoice.invoiceDate <= periodEnd) {
          outputGst += invoice.cgst + invoice.sgst + invoice.igst;
        };
      };
    };

    for (expense in expenses.values()) {
      if (expense.businessId == businessId) {
        if (expense.expenseDate >= periodStart and expense.expenseDate <= periodEnd) {
          inputGst += expense.gstAmount;
        };
      };
    };

    let netGstPayable = if (outputGst > inputGst) { outputGst - inputGst } else { 0 };

    let report : GstReport = {
      id = gstReportIdCounter;
      businessId;
      periodStart;
      periodEnd;
      outputGst;
      inputGst;
      netGstPayable;
      createdAt = Time.now();
    };

    gstReports.add(gstReportIdCounter, report);
    gstReportIdCounter += 1;
    gstReportIdCounter - 1;
  };

  // Subscription Operations
  public query ({ caller }) func getSubscriptionStatus(userId : Principal) : async SubscriptionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subscription status");
    };

    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own subscription");
    };

    let tier = switch (userSubscriptions.get(userId)) {
      case (null) { #free };
      case (?t) { t };
    };

    var invoiceCount = 0;
    var customerCount = 0;
    var productCount = 0;

    for (business in businesses.values()) {
      if (business.owner == userId) {
        for (invoice in invoices.values()) {
          if (invoice.businessId == business.id) {
            invoiceCount += 1;
          };
        };
        for (customer in customers.values()) {
          if (customer.businessId == business.id) {
            customerCount += 1;
          };
        };
        for (product in products.values()) {
          if (product.businessId == business.id) {
            productCount += 1;
          };
        };
      };
    };

    {
      tier;
      invoiceCount;
      customerCount;
      productCount;
    };
  };

  // Dashboard Operations
  public query ({ caller }) func getDashboardData(businessId : Nat) : async DashboardData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    var totalReceivables = 0;
    var totalPayables = 0;
    var currentMonthOutputGst = 0;
    var currentMonthInputGst = 0;
    var overdueInvoiceCount = 0;

    let now = Time.now();
    let monthStart = now - (30 * 24 * 60 * 60 * 1_000_000_000);

    for (invoice in invoices.values()) {
      if (invoice.businessId == businessId) {
        if (invoice.status != #paid) {
          totalReceivables += invoice.totalAmount;
        };
        if (invoice.status == #overdue) {
          overdueInvoiceCount += 1;
        };
        if (invoice.invoiceDate >= monthStart and (invoice.status == #paid or invoice.status == #sent)) {
          currentMonthOutputGst += invoice.cgst + invoice.sgst + invoice.igst;
        };
      };
    };

    for (expense in expenses.values()) {
      if (expense.businessId == businessId) {
        totalPayables += expense.amount;
        if (expense.expenseDate >= monthStart) {
          currentMonthInputGst += expense.gstAmount;
        };
      };
    };

    let netGstPayable = if (currentMonthOutputGst > currentMonthInputGst) {
      currentMonthOutputGst - currentMonthInputGst;
    } else {
      0;
    };

    let allInvoices = invoices.values().toArray().filter(
      func(i) { i.businessId == businessId }
    );

    let recentInvoicesList = List.empty<Invoice>();
    var i = 0;
    for (invoice in allInvoices.values()) {
      if (i < 5) {
        recentInvoicesList.add(invoice);
        i += 1;
      };
    };
    let recentInvoices = recentInvoicesList.toArray();

    {
      totalReceivables;
      totalPayables;
      currentMonthOutputGst;
      currentMonthInputGst;
      netGstPayable;
      overdueInvoiceCount;
      recentInvoices;
    };
  };

  // AI Assistant Query
  public query ({ caller }) func queryAI(businessId : Nat, userMessage : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query AI assistant");
    };

    let _ = verifyBusinessOwnership(caller, businessId);

    if (userMessage.contains(#text "gst liability") or userMessage.contains(#text "how much gst")) {
      var outputGst = 0;
      var inputGst = 0;
      let now = Time.now();
      let monthStart = now - (30 * 24 * 60 * 60 * 1_000_000_000);

      for (invoice in invoices.values()) {
        if (invoice.businessId == businessId and invoice.invoiceDate >= monthStart and (invoice.status == #paid or invoice.status == #sent)) {
          outputGst += invoice.cgst + invoice.sgst + invoice.igst;
        };
      };

      for (expense in expenses.values()) {
        if (expense.businessId == businessId and expense.expenseDate >= monthStart) {
          inputGst += expense.gstAmount;
        };
      };

      let netGst = if (outputGst > inputGst) { outputGst - inputGst } else { 0 };
      return "Current month GST liability: Output GST: " # outputGst.toText() # ", Input GST: " # inputGst.toText() # ", Net GST Payable: " # netGst.toText();
    } else if (userMessage.contains(#text "overdue") or userMessage.contains(#text "hasn't paid")) {
      let overdueInvoices = invoices.values().toArray().filter(
        func(i) { i.businessId == businessId and i.status == #overdue }
      );
      return "You have " # overdueInvoices.size().toText() # " overdue invoices.";
    } else if (userMessage.contains(#text "validate gstin")) {
      return "GSTIN must be exactly 15 characters long and follow the format: 2 digits (state code) + 10 alphanumeric (PAN) + 1 digit (entity number) + 1 letter (Z) + 1 alphanumeric (checksum).";
    } else if (userMessage.contains(#text "cash flow")) {
      var receivables = 0;
      var payables = 0;

      for (invoice in invoices.values()) {
        if (invoice.businessId == businessId and invoice.status != #paid) {
          receivables += invoice.totalAmount;
        };
      };

      for (expense in expenses.values()) {
        if (expense.businessId == businessId) {
          payables += expense.amount;
        };
      };

      return "Cash Flow: Total Receivables: " # receivables.toText() # ", Total Payables: " # payables.toText();
    } else if (userMessage.contains(#text "intra-state") or userMessage.contains(#text "igst") or userMessage.contains(#text "cgst")) {
      return "GST Types: Intra-state transactions (within same state) attract CGST + SGST. Inter-state transactions (across states) attract IGST.";
    } else {
      return "I'm your AI accounting assistant. I can help you with GST liability, overdue invoices, GSTIN validation, cash flow analysis, and GST rules. How can I assist you today?";
    };
  };
};
