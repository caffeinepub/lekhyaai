import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Array "mo:core/Array";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";
import Stripe "stripe/stripe";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";
import Int "mo:core/Int";
import Migration "migration";

(with migration = Migration.run) actor {
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

  // CRM Leads System
  public type LeadStage = {
    #enquiry;
    #followup;
    #onboarded;
  };

  public type KycType = {
    #india;
    #overseas;
  };

  public type CrmLead = {
    id : Nat;
    formattedId : Text;
    name : Text;
    email : Text;
    phone : Text;
    companyName : Text;
    stage : LeadStage;
    kycType : KycType;
    gstin : Text;
    pan : Text;
    cin : Text;
    tinEin : Text;
    incorporationCert : Text;
    notes : Text;
    subscriptionModules : [Text];
    createdAt : Time.Time;
  };

  // Notifications System
  public type Notification = {
    id : Nat;
    fromPrincipal : Principal;
    fromRole : Text;
    toAll : Bool;
    toPrincipal : ?Principal;
    title : Text;
    message : Text;
    isRead : Bool;
    createdAt : Time.Time;
  };

  // Activity Log System
  public type ActivityLog = {
    id : Nat;
    userId : Principal;
    userName : Text;
    action : Text;
    moduleName : Text;
    details : Text;
    timestamp : Time.Time;
  };

  // Razorpay Configuration and Types
  public type RazorpayOrder = {
    id : Text;
    amount : Nat;
    currency : Text;
    receipt : Text;
    status : Text;
    createdAt : Time.Time;
  };

  public type TenantStatus = {
    #active;
    #suspended;
    #expired;
  };

  public type ClientTenant = {
    id : Nat;
    tenantId : Text;
    clientPrincipal : Principal;
    businessName : Text;
    contactEmail : Text;
    subscriptionPlan : Text;
    subscriptionStartDate : Time.Time;
    subscriptionEndDate : Time.Time;
    status : TenantStatus;
    crmLeadId : ?Nat;
    provisionedAt : Time.Time;
  };

  public type PaymentRecord = {
    id : Nat;
    orderId : Text;
    clientPrincipal : Principal;
    clientName : Text;
    subscriptionPlan : Text;
    amountInr : Nat;
    paymentStatus : Text;
    paymentMethod : Text;
    createdAt : Time.Time;
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
  let crmLeads = Map.empty<Nat, CrmLead>();
  let notifications = Map.empty<Nat, Notification>();
  let activityLogs = Map.empty<Nat, ActivityLog>();
  var razorpayKeyId : ?Text = null;
  var razorpayKeySecret : ?Text = null;
  let clientTenants = Map.empty<Nat, ClientTenant>();
  let paymentRecords = Map.empty<Nat, PaymentRecord>();

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
  var enquiryCounter = 1001;
  var followupCounter = 1001;
  var onboardedCounter = 1001;
  var notificationIdCounter = 1;
  var activityLogIdCounter = 1;
  var clientTenantIdCounter = 1;
  var paymentRecordIdCounter = 1;

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

  func getBusinessUserRole(caller : Principal, businessId : Nat) : ?BusinessRole {
    let business = switch (businesses.get(businessId)) {
      case (null) { return null };
      case (?b) { b };
    };

    // Owner has implicit admin role
    if (business.owner == caller) {
      return ?#admin;
    };

    for (role in businessUserRoles.values()) {
      if (role.businessId == businessId and role.userPrincipal == caller) {
        return ?role.role;
      };
    };

    null;
  };

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

  // Razorpay Configuration Functions
  public shared ({ caller }) func setRazorpayConfiguration(keyId : Text, keySecret : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can configure Razorpay");
    };
    razorpayKeyId := ?keyId;
    razorpayKeySecret := ?keySecret;
  };

  // Public function - no auth required (for frontend SDK)
  public query func getRazorpayKeyId() : async Text {
    switch (razorpayKeyId) {
      case (null) { Runtime.trap("Razorpay not configured") };
      case (?keyId) { keyId };
    };
  };

  // Public function - no auth required
  public query func isRazorpayConfigured() : async Bool {
    switch (razorpayKeyId, razorpayKeySecret) {
      case (null, _) { false };
      case (_, null) { false };
      case (?_, ?_) { true };
    };
  };

  public shared ({ caller }) func createRazorpayOrder(amountInPaise : Nat, currency : Text, receipt : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create Razorpay orders");
    };
    switch (razorpayKeyId, razorpayKeySecret) {
      case (null, _) { Runtime.trap("Razorpay not configured") };
      case (_, null) { Runtime.trap("Razorpay not configured") };
      case (?keyId, ?keySecret) {
        let url = "https://api.razorpay.com/v1/orders";
        let authHeader = "Basic " # toBase64(keyId # ":" # keySecret);
        let body = "{\"amount\": " # amountInPaise.toText() # ", \"currency\": \"" # currency # "\", \"receipt\": \"" # receipt # "\"}";
        let extraHeaders = [
          { name = "Authorization"; value = authHeader },
          { name = "Content-Type"; value = "application/json" },
        ];
        let response = await OutCall.httpPostRequest(url, extraHeaders, body, transform);
        let orderId = extractOrderIdFromResponse(response);
        orderId;
      };
    };
  };

  // TODO: Replace these placeholder functions with actual base64 encoding and JSON parsing
  func toBase64(_input : Text) : Text { _input };
  func extractOrderIdFromResponse(_jsonResponse : Text) : Text { "ORDERID_placeholder" };

  // Client Tenant Management Functions
  public shared ({ caller }) func provisionClientTenant(clientPrincipal : Principal, businessName : Text, contactEmail : Text, subscriptionPlan : Text, durationDays : Nat) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can provision tenants");
    };
    let tenantId = "TEN-" # clientTenantIdCounter.toText();
    let startDate = Time.now();
    let endDate = startDate + (durationDays.toNat() * 24 * 60 * 60 * 1000 * 1000000);
    let tenant : ClientTenant = {
      id = clientTenantIdCounter;
      tenantId;
      clientPrincipal;
      businessName;
      contactEmail;
      subscriptionPlan;
      subscriptionStartDate = startDate;
      subscriptionEndDate = endDate;
      status = #active;
      crmLeadId = null;
      provisionedAt = startDate;
    };
    clientTenants.add(clientTenantIdCounter, tenant);
    clientTenantIdCounter += 1;
    tenantId;
  };

  public query ({ caller }) func getClientTenants() : async [ClientTenant] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view tenants");
    };
    clientTenants.values().toArray();
  };

  public query ({ caller }) func getMyTenant() : async ?ClientTenant {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their tenant");
    };
    let tenants = clientTenants.values().toArray();
    tenants.find<ClientTenant>(func(t) { t.clientPrincipal == caller });
  };

  public shared ({ caller }) func suspendTenant(tenantId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can suspend tenants");
    };
    updateTenantStatus(tenantId, #suspended);
  };

  public shared ({ caller }) func reactivateTenant(tenantId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can reactivate tenants");
    };
    updateTenantStatus(tenantId, #active);
  };

  func updateTenantStatus(tenantId : Text, status : TenantStatus) {
    let tenants = clientTenants.values().toArray();
    for (tenant in tenants.vals()) {
      if (tenant.tenantId == tenantId) {
        let updatedTenant = { tenant with status };
        clientTenants.add(tenant.id, updatedTenant);
        return;
      };
    };
    Runtime.trap("Tenant not found");
  };

  public shared ({ caller }) func updateTenantSubscription(tenantId : Text, newPlan : Text, additionalDays : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can update subscriptions");
    };
    let tenants = clientTenants.values().toArray();
    for (tenant in tenants.vals()) {
      if (tenant.tenantId == tenantId) {
        let newEndDate = tenant.subscriptionEndDate + (additionalDays.toNat() * 24 * 60 * 60 * 1000 * 1000000);
        let updatedTenant = {
          tenant with
          subscriptionPlan = newPlan;
          subscriptionEndDate = newEndDate;
        };
        clientTenants.add(tenant.id, updatedTenant);
        return;
      };
    };
    Runtime.trap("Tenant not found");
  };

  // Payment Record Management Functions
  public shared ({ caller }) func recordPayment(orderId : Text, clientPrincipal : Principal, clientName : Text, subscriptionPlan : Text, amountInr : Nat, paymentMethod : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can record payments");
    };
    let payment : PaymentRecord = {
      id = paymentRecordIdCounter;
      orderId;
      clientPrincipal;
      clientName;
      subscriptionPlan;
      amountInr;
      paymentStatus = "success";
      paymentMethod;
      createdAt = Time.now();
    };
    paymentRecords.add(paymentRecordIdCounter, payment);
    paymentRecordIdCounter += 1;
  };

  public query ({ caller }) func getPaymentRecords() : async [PaymentRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view payment records");
    };
    paymentRecords.values().toArray();
  };

  public query ({ caller }) func getPaymentSummary() : async {
    totalRevenue : Nat;
    activeSubscriptions : Nat;
    expiringIn30Days : Nat;
    suspendedAccounts : Nat;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view payment summary");
    };
    let payments = paymentRecords.values().toArray();
    let tenants = clientTenants.values().toArray();
    let totalRevenue = payments.foldLeft(0, func(acc, p) { acc + p.amountInr });
    let activeSubscriptions = tenants.filter(func(t) { t.status == #active }).size();
    let now = Time.now();
    let expiringIn30Days = tenants.filter(
      func(t) { t.status == #active and t.subscriptionEndDate > now and t.subscriptionEndDate <= (now + (30 * 24 * 60 * 60 * 1000 * 1000000)) }
    ).size();
    let suspendedAccounts = tenants.filter(func(t) { t.status == #suspended }).size();
    {
      totalRevenue;
      activeSubscriptions;
      expiringIn30Days;
      suspendedAccounts;
    };
  };

  //---------------------------------------- EXISTING FUNCTIONS ----------------------------------------

  // Public query - no auth required
  public query func isStripeConfigured() : async Bool {
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

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check Stripe session status");
    };
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { await Stripe.getSessionStatus(value, sessionId, transform) };
    };
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create checkout sessions");
    };
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { await Stripe.createCheckoutSession(value, caller, items, successUrl, cancelUrl, transform) };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

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

  public shared ({ caller }) func inviteUserToBusinessRole(businessId : Nat, userPrincipal : Principal, role : BusinessRole) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can invite to businesses");
    };

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

    businessUserRoles.values().toArray().filter<BusinessUserRole>(
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

    let _ = verifyBusinessOwnership(caller, role.businessId);

    businessUserRoles.remove(roleId);
  };

  public query ({ caller }) func getMyBusinessRole(businessId : Nat) : async ?BusinessRole {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their role");
    };

    getBusinessUserRole(caller, businessId);
  };

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
    seedChartOfAccounts(businessIdCounter);

    businessIdCounter += 1;
    businessIdCounter - 1;
  };

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
};
