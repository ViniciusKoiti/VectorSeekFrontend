/**
 * Billing API Endpoints
 * Centralized API endpoint definitions for billing operations
 */

export const BILLING_API_ENDPOINTS = {
  // Checkout
  createCheckoutSession: () => '/api/billing/checkout/create-session',

  // Subscription
  getSubscription: () => '/api/billing/subscription',
  cancelSubscription: () => '/api/billing/subscription/cancel',
  updateSubscription: () => '/api/billing/subscription/update',

  // Customer Portal
  getCustomerPortalUrl: () => '/api/billing/portal',

  // Invoices
  getInvoices: () => '/api/billing/invoices',
  getInvoice: (invoiceId: string) => `/api/billing/invoices/${invoiceId}`,
  downloadInvoice: (invoiceId: string) => `/api/billing/invoices/${invoiceId}/download`,

  // Dashboard
  getDashboardData: () => '/api/billing/dashboard',

  // Plans
  getPlans: () => '/api/billing/plans',
} as const;
