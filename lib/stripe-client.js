import { loadStripe } from '@stripe/stripe-js'

let stripePromise

export const getStripeClient = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (publishableKey && publishableKey !== 'pk_test_your_publishable_key') {
      stripePromise = loadStripe(publishableKey)
    }
  }
  return stripePromise
}
