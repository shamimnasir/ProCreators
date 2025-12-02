import Stripe from 'stripe'

let stripeInstance = null

export const getStripe = () => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey || secretKey === 'sk_test_your_secret_key') {
      throw new Error('Stripe secret key not configured')
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    })
  }
  return stripeInstance
}

export default getStripe

export const isStripeConfigured = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  return secretKey && secretKey !== 'sk_test_your_secret_key'
}
