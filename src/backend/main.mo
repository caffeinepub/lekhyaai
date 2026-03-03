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
import Stripe "stripe/stripe";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";
import Int "mo:core/Int";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    email : Text;
  };

  // Business User Role Types
  public type BusinessRole = {
    #admin;
    #accountant;
    #ca;
  };

  public type BusinessUserRole = {
    id : Nat;
    businessId : Nat;
    userPrincipal : Principal;
    role : BusinessRole;
    invitedBy : Principal;
    createdAt : Time.Time;
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

  // Bank Account Types
  public type AccountType = {
    #current;
    #savings;
    #creditCard;
    #overdraft;
  };

  public type BankAccount = {
    id : Nat;
    businessId : Nat;
    bankName : Text;
    accountNumber : Text;
    ifscCode : Text;
    branch : Text;
    accountType : AccountType;
    openingBalance : Nat;
    openingDate : Time.Time;
    isActive : Bool;
    createdAt : Time.Time;
  };

  public type BankTransaction = {
    id : Nat;
    bankAccountId : Nat;
    date : Time.Time;
    description : Text;
    debitAmount : Nat;
    creditAmount : Nat;
    reference : Text;
    isReconciled : Bool;
    reconciliationDate : ?Time.Time;
    createdAt : Time.Time;
  };

  public type ReconciliationSummary = {
    bookBalance : Nat;
    bankBalance : Nat;
    unreconciledCount : Nat;
    difference : Int;
  };

  // Petty Cash Types
  public type PettyCashAccount = {
    id : Nat;
    businessId : Nat;
    custodianName : Text;
    openingBalance : Nat;
    currentBalance : Nat;
    createdAt : Time.Time;
  };

  public type PettyCashTransactionType = {
    #receipt;
    #payment;
  };

  public type PettyCashTransaction = {
    id : Nat;
    pettyCashAccountId : Nat;
    date : Time.Time;
    description : Text;
    amount : Nat;
    category : Text;
    voucherNumber : Text;
    transactionType : PettyCashTransactionType;
    approvedBy : Text;
    createdAt : Time.Time;
  };

  // Chart of Accounts Types
  public type AccountGroup = {
    #Assets;
    #Liabilities;
    #Capital;
    #Revenue;
    #Expenses;
  };

  public type Account = {
    id : Nat;
    businessId : Nat;
    accountCode : Text;
    accountName : Text;
    accountGroup : AccountGroup;
    accountSubGroup : Text;
    isSystem : Bool;
    isActive : Bool;
    createdAt : Time.Time;
  };

  // Journal Entry Types
  public type JournalEntry = {
    id : Nat;
    businessId : Nat;
    entryNumber : Text;
    date : Time.Time;
    narration : Text;
    postedBy : Principal;
    isReversed : Bool;
    createdAt : Time.Time;
  };

  public type JournalEntryLine = {
    id : Nat;
    journalEntryId : Nat;
    accountId : Nat;
    accountName : Text;
    debit : Nat;
    credit : Nat;
    lineNarration : Text;
  };

  // Report Types
  public type ProfitAndLossReport = {
    totalSalesRevenue : Nat;
    expensesByCategory : [(Text, Nat)];
    grossProfit : Int;
    operatingExpenses : Nat;
    netProfit : Int;
  };

  public type BalanceSheetReport = {
    totalAssets : Nat;
    totalLiabilities : Nat;
    equity : Int;
    cashAndBank : Nat;
    receivables : Nat;
    inventoryValue : Nat;
    unpaidExpenses : Nat;
    gstPayable : Nat;
  };

  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Storage Maps
  let userProfiles = Map.empty<Principal, UserProfile>();
  let businesses = Map.empty<Nat, Business>();
  let businessUserRoles = Map.empty<Nat, BusinessUserRole>();
  let customers = Map.empty<Nat, Customer>();
  let vendors = Map.empty<Nat, Vendor>();
  let products = Map.empty<Nat, Product>();
  let invoices = Map.empty<Nat, Invoice>();
  let invoiceItems = Map.empty<Nat, InvoiceItem>();
  let expenses = Map.empty<Nat, Expense>();
  let payments = Map.empty<Nat, Payment>();
  let gstReports = Map.empty<Nat, GstReport>();
  let userSubscriptions = Map.empty<Principal, SubscriptionTier>();
  let bankAccounts = Map.empty<Nat, BankAccount>();
  let bankTransactions = Map.empty<Nat, BankTransaction>();
  let pettyCashAccounts = Map.empty<Nat, PettyCashAccount>();
  let pettyCashTransactions = Map.empty<Nat, PettyCashTransaction>();
  let accounts = Map.empty<Nat, Account>();
  let journalEntries = Map.empty<Nat, JournalEntry>();
  let journalEntryLines = Map.empty<Nat, JournalEntryLine>();

  // ID Counters
  var businessIdCounter = 1;
  var businessUserRoleIdCounter = 1;
  var customerIdCounter = 1;
  var vendorIdCounter = 1;
  var productIdCounter = 1;
  var invoiceIdCounter = 1;
  var invoiceItemIdCounter = 1;
  var expenseIdCounter = 1;
  var paymentIdCounter = 1;
  var gstReportIdCounter = 1;
  var bankAccountIdCounter = 1;
  var bankTransactionIdCounter = 1;
  var pettyCashAccountIdCounter = 1;
  var pettyCashTransactionIdCounter = 1;
  var accountIdCounter = 1;
  var journalEntryIdCounter = 1;
  var journalEntryLineIdCounter = 1;

  // Helper function to check if user has any role for a business
  func hasBusinessAccess(caller : Principal, businessId : Nat) : Bool {
    let business = switch (businesses.get(businessId)) {
      case (null) { return false };
      case (?b) { b };
    };

    // Owner always has access
    if (business.owner == caller) {
      return true;
    };

    // Check if user has any assigned role
    for (role in businessUserRoles.values()) {
      if (role.businessId == businessId and role.userPrincipal == caller) {
        return true;
      };
    };

    false;
  };

  // Helper function to get user's role for a business
  func getBusinessUserRole(caller : Principal, businessId : Nat) : ?BusinessRole {
    let business = switch (businesses.get(businessId)) {
      case (null) { return null };
      case (?b) { b };
    };

    // Owner has implicit admin role
    if (business.owner == caller) {
      return ?#admin;
    };

    // Check assigned roles
    for (role in businessUserRoles.values()) {
      if (role.businessId == businessId and role.userPrincipal == caller) {
        return ?role.role;
      };
    };

    null;
  };

  // Helper function to verify business read access
  func verifyBusinessReadAccess(caller : Principal, businessId : Nat) : Business {
    let business = switch (businesses.get(businessId)) {
      case (null) { Runtime.trap("Business not found") };
      case (?b) { b };
    };

    if (not hasBusinessAccess(caller, businessId)) {
      Runtime.trap("Unauthorized: You do not have access to this business");
    };

    business;
  };

  // Helper function to verify business write access (accountant or admin)
  func verifyBusinessWriteAccess(caller : Principal, businessId : Nat) : Business {
    let business = switch (businesses.get(businessId)) {
      case (null) { Runtime.trap("Business not found") };
      case (?b) { b };
    };

    let role = getBusinessUserRole(caller, businessId);
    switch (role) {
      case (null) { Runtime.trap("Unauthorized: You do not have access to this business") };
      case (?#ca) { Runtime.trap("Unauthorized: CA role has read-only access") };
      case (?#accountant) { /* allowed */ };
      case (?#admin) { /* allowed */ };
    };

    business;
  };

  // Helper function to verify business delete access (admin only)
  func verifyBusinessDeleteAccess(caller : Principal, businessId : Nat) : Business {
    let business = switch (businesses.get(businessId)) {
      case (null) { Runtime.trap("Business not found") };
      case (?b) { b };
    };

    let role = getBusinessUserRole(caller, businessId);
    switch (role) {
      case (null) { Runtime.trap("Unauthorized: You do not have access to this business") };
      case (?#ca) { Runtime.trap("Unauthorized: Only admins can delete") };
      case (?#accountant) { Runtime.trap("Unauthorized: Only admins can delete") };
      case (?#admin) { /* allowed */ };
    };

    business;
  };

  // Helper function to verify business ownership (for sensitive operations)
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

  // Business User Role Operations
  public shared ({ caller }) func inviteUserToBusinessRole(businessId : Nat, userPrincipal : Principal, role : BusinessRole) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can invite to businesses");
    };

    // Only business owner can invite users
    let _ = verifyBusinessOwnership(caller, businessId);

    let businessUserRole : BusinessUserRole = {
      id = businessUserRoleIdCounter;
      businessId;
      userPrincipal;
      role;
      invitedBy = caller;
      createdAt = Time.now();
    };

    businessUserRoles.add(businessUserRoleIdCounter, businessUserRole);
    businessUserRoleIdCounter += 1;
    businessUserRoleIdCounter - 1;
  };

  public query ({ caller }) func getBusinessUsers(businessId : Nat) : async [BusinessUserRole] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view business users");
    };

    let _ = verifyBusinessReadAccess(caller, businessId);

    businessUserRoles.values().toArray().filter(
      func(r) { r.businessId == businessId }
    );
  };

  public shared ({ caller }) func removeBusinessUser(roleId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove business users");
    };

    let role = switch (businessUserRoles.get(roleId)) {
      case (null) { Runtime.trap("Business user role not found") };
      case (?r) { r };
    };

    // Only business owner can remove users
    let _ = verifyBusinessOwnership(caller, role.businessId);

    businessUserRoles.remove(roleId);
  };

  public query ({ caller }) func getMyBusinessRole(businessId : Nat) : async ?BusinessRole {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their role");
    };

    getBusinessUserRole(caller, businessId);
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
    
    // Seed standard Indian chart of accounts
    seedChartOfAccounts(businessIdCounter);
    
    businessIdCounter += 1;
    businessIdCounter - 1;
  };

  // Helper function to seed chart of accounts
  func seedChartOfAccounts(businessId : Nat) {
    let standardAccounts : [(Text, Text, AccountGroup, Text)] = [
      ("1001", "Cash in Hand", #Assets, "Current Assets"),
      ("1002", "Petty Cash", #Assets, "Current Assets"),
      ("1003", "Bank Current Account", #Assets, "Current Assets"),
      ("1004", "Bank Savings Account", #Assets, "Current Assets"),
      ("1005", "Accounts Receivable (Debtors)", #Assets, "Current Assets"),
      ("1006", "Inventory", #Assets, "Current Assets"),
      ("1007", "GST Receivable (Input Credit)", #Assets, "Current Assets"),
      ("1008", "TDS Receivable", #Assets, "Current Assets"),
      ("1101", "Fixed Assets", #Assets, "Non-Current Assets"),
      ("1102", "Accumulated Depreciation", #Assets, "Non-Current Assets"),
      ("2001", "Accounts Payable (Creditors)", #Liabilities, "Current Liabilities"),
      ("2002", "GST Payable - CGST", #Liabilities, "Current Liabilities"),
      ("2003", "GST Payable - SGST", #Liabilities, "Current Liabilities"),
      ("2004", "GST Payable - IGST", #Liabilities, "Current Liabilities"),
      ("2005", "TDS Payable", #Liabilities, "Current Liabilities"),
      ("2006", "TCS Payable", #Liabilities, "Current Liabilities"),
      ("2007", "PF Payable", #Liabilities, "Current Liabilities"),
      ("2008", "ESI Payable", #Liabilities, "Current Liabilities"),
      ("2009", "Salary Payable", #Liabilities, "Current Liabilities"),
      ("2010", "Rent Payable", #Liabilities, "Current Liabilities"),
      ("2101", "Short Term Loans", #Liabilities, "Non-Current Liabilities"),
      ("2102", "Long Term Loans", #Liabilities, "Non-Current Liabilities"),
      ("3001", "Capital Account", #Capital, "Equity"),
      ("3002", "Drawings", #Capital, "Equity"),
      ("3003", "Retained Earnings", #Capital, "Equity"),
      ("4001", "Sales Revenue", #Revenue, "Operating Revenue"),
      ("4002", "Service Revenue", #Revenue, "Operating Revenue"),
      ("4003", "Other Income", #Revenue, "Other Revenue"),
      ("4004", "Interest Income", #Revenue, "Other Revenue"),
      ("4005", "Discount Received", #Revenue, "Other Revenue"),
      ("5001", "Purchase of Goods", #Expenses, "Cost of Sales"),
      ("5002", "Cost of Services", #Expenses, "Cost of Sales"),
      ("5101", "Salaries and Wages", #Expenses, "Operating Expenses"),
      ("5102", "Rent Expense", #Expenses, "Operating Expenses"),
      ("5103", "Electricity Expense", #Expenses, "Operating Expenses"),
      ("5104", "Telephone Expense", #Expenses, "Operating Expenses"),
      ("5105", "Internet Expense", #Expenses, "Operating Expenses"),
      ("5106", "Office Supplies", #Expenses, "Operating Expenses"),
      ("5107", "Travel and Conveyance", #Expenses, "Operating Expenses"),
      ("5108", "Advertising and Marketing", #Expenses, "Operating Expenses"),
      ("5109", "Professional Fees", #Expenses, "Operating Expenses"),
      ("5110", "Audit Fees", #Expenses, "Operating Expenses"),
      ("5111", "Bank Charges", #Expenses, "Operating Expenses"),
      ("5112", "Depreciation Expense", #Expenses, "Operating Expenses"),
      ("5113", "Repairs and Maintenance", #Expenses, "Operating Expenses"),
      ("5114", "Insurance Expense", #Expenses, "Operating Expenses"),
      ("5115", "Miscellaneous Expenses", #Expenses, "Operating Expenses"),
    ];

    for ((code, name, group, subGroup) in standardAccounts.vals()) {
      let account : Account = {
        id = accountIdCounter;
        businessId;
        accountCode = code;
        accountName = name;
        accountGroup = group;
        accountSubGroup = subGroup;
        isSystem = true;
        isActive = true;
        createdAt = Time.now();
      };
      accounts.add(accountIdCounter, account);
      accountIdCounter += 1;
    };
  };

  public query ({ caller }) func getMyBusinesses() : async [Business] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their businesses");
    };

    // Return businesses owned by caller plus businesses where caller has a role
    let ownedBusinesses = businesses.values().toArray().filter(
      func(b) { b.owner == caller }
    );

    let roleBusinessIds = businessUserRoles.values().toArray().filter(
      func(r) { r.userPrincipal == caller }
    ).map(func(r) { r.businessId });

    let roleBusinesses = businesses.values().toArray().filter(
      func(b) {
        for (id in roleBusinessIds.vals()) {
          if (b.id == id) { return true };
        };
        false;
      }
    );

    ownedBusinesses.concat(roleBusinesses);
  };

  public query ({ caller }) func getBusiness(id : Nat) : async Business {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view businesses");
    };

    verifyBusinessReadAccess(caller, id);
  };

  public shared ({ caller }) func updateBusiness(id : Nat, name : Text, gstin : Text, state : Text, address : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update businesses");
    };

    let business = verifyBusinessWriteAccess(caller, id);

    let updatedBusiness = { business with name; gstin; state; address };
    businesses.add(id, updatedBusiness);
  };

  public shared ({ caller }) func deleteBusiness(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete businesses");
    };

    let _ = verifyBusinessDeleteAccess(caller, id);
    businesses.remove(id);
  };

  // Customer Operations
  public shared ({ caller }) func createCustomer(businessId : Nat, name : Text, gstin : Text, phone : Text, email : Text, address : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create customers");
    };

    let _ = verifyBusinessWriteAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, customer.businessId);
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

    let _ = verifyBusinessWriteAccess(caller, customer.businessId);

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

    let _ = verifyBusinessDeleteAccess(caller, customer.businessId);
    customers.remove(id);
  };

  // Vendor Operations
  public shared ({ caller }) func createVendor(businessId : Nat, name : Text, gstin : Text, phone : Text, email : Text, address : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create vendors");
    };

    let _ = verifyBusinessWriteAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, vendor.businessId);
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

    let _ = verifyBusinessWriteAccess(caller, vendor.businessId);

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

    let _ = verifyBusinessDeleteAccess(caller, vendor.businessId);
    vendors.remove(id);
  };

  // Product Operations
  public shared ({ caller }) func createProduct(businessId : Nat, name : Text, hsnCode : Text, gstRate : Nat, purchasePrice : Nat, sellingPrice : Nat, stockQuantity : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create products");
    };

    let _ = verifyBusinessWriteAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, product.businessId);
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

    let _ = verifyBusinessWriteAccess(caller, product.businessId);

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

    let _ = verifyBusinessDeleteAccess(caller, product.businessId);
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

    let _ = verifyBusinessWriteAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, invoice.businessId);
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

    let _ = verifyBusinessWriteAccess(caller, invoice.businessId);

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

    let _ = verifyBusinessWriteAccess(caller, invoice.businessId);

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

    let _ = verifyBusinessReadAccess(caller, businessId);

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

    let _ = verifyBusinessDeleteAccess(caller, invoice.businessId);
    invoices.remove(id);
  };

  // Expense Operations
  public shared ({ caller }) func createExpense(businessId : Nat, vendorId : ?Nat, category : Text, amount : Nat, gstAmount : Nat, expenseDate : Time.Time, description : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create expenses");
    };

    let _ = verifyBusinessWriteAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, businessId);

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

    let _ = verifyBusinessReadAccess(caller, expense.businessId);
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

    let _ = verifyBusinessWriteAccess(caller, expense.businessId);

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

    let _ = verifyBusinessDeleteAccess(caller, expense.businessId);
    expenses.remove(id);
  };

  // GST Report Operations
  public shared ({ caller }) func generateGstReport(businessId : Nat, periodStart : Time.Time, periodEnd : Time.Time) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate GST reports");
    };

    let _ = verifyBusinessReadAccess(caller, businessId);

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

  // Additional code omitted for brevity...
};
