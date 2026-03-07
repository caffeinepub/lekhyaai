# LekhyaAI

## Current State

LekhyaAI is a full-stack Indian GST accounting SaaS with:
- Stripe component already in caffeine.lock.json
- Backend already exposes: `createCheckoutSession`, `isStripeConfigured`, `setStripeConfiguration`, `getStripeSessionStatus`
- `SubscriptionPage` already calls `createCheckoutSession` and redirects to Stripe checkout
- `PaymentCheckoutPage` is a fake card form UI (simulated, no real payment)
- `SuperuserSettingsPage` has a "Payment Gateway" section that saves API keys to localStorage only — it does NOT call `setStripeConfiguration` on the backend
- No success/cancel URL handling after Stripe redirects back

## Requested Changes (Diff)

### Add
- A "Configure Stripe on Backend" button in SuperUser Settings Payment Gateway section that calls `actor.setStripeConfiguration({ secretKey, allowedCountries })` to persist the key in the ICP backend
- A status indicator in SuperUser Settings showing whether Stripe is configured on the backend (`actor.isStripeConfigured()`)
- Success and cancel URL callback handling in `SubscriptionPage` — read `?success=1` or `?cancelled=1` from the URL and show appropriate toast/UI

### Modify
- `PaymentCheckoutPage`: Replace the fake card form with a real Stripe Checkout redirect flow using `createCheckoutSession`. Show plan summary, a "Proceed to Secure Checkout" button that calls the backend, and redirects to the Stripe-hosted checkout page. On return (success/cancel URL), show appropriate status.
- `SuperuserSettingsPage` Payment Gateway section: Add a "Save to Backend" button that calls `setStripeConfiguration` with the entered secret key and a default `allowedCountries: ["IN"]` (India). Show a live/not-configured badge based on `isStripeConfigured()`.
- `SubscriptionPage`: Handle `?success=1` (show success message, subscription activated) and `?cancelled=1` (show cancelled message) query params after Stripe redirect returns

### Remove
- The fake card input fields (card number, expiry, CVV, name on card) from `PaymentCheckoutPage`
- The simulated 2-second delay payment processing from `PaymentCheckoutPage`

## Implementation Plan

1. **SuperuserSettingsPage**: 
   - Import `useActor` to get actor
   - Add `isStripeConfigured` query using `actor.isStripeConfigured()` — show a badge (Configured / Not Configured)
   - Add "Save to Backend" button in Payment Gateway section that calls `actor.setStripeConfiguration({ secretKey: config.paymentGatewaySecret, allowedCountries: ["IN"] })`
   - Show success/error toast after save

2. **PaymentCheckoutPage**:
   - Remove fake card form UI
   - Add plan summary card with amount, plan name, billing period
   - Add "Proceed to Secure Checkout" button that:
     - Calls `actor.isStripeConfigured()` — if not configured, show error with support message
     - Calls `actor.createCheckoutSession(items, successUrl, cancelUrl)` 
     - Redirects to the returned Stripe URL
   - Handle `?success=1` URL param: show success state with receipt and "Go to Dashboard" button
   - Handle `?cancelled=1` URL param: show cancelled state with "Try Again" button
   - Keep the existing plan summary header (plan name, amount, billing mode badge)

3. **SubscriptionPage**:
   - Read URL params on mount
   - If `?success=1`: show success toast "Subscription activated! You now have full access."
   - If `?cancelled=1`: show info toast "Checkout was cancelled."
   - Clean up URL params after handling (replace URL without query string)
