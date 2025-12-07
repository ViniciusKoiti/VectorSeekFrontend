/**
 * Billing Models
 * Types and interfaces for payment and subscription management
 */

export enum PlanType {
  FREE = 'free',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired'
}

export enum BillingInterval {
  MONTHLY = 'month',
  YEARLY = 'year'
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number | string;
}

export interface PricingPlan {
  id: string;
  name: string;
  type: PlanType;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  interval: BillingInterval;
  amount: number;
  currency: string;
  trialEnd?: string;
  canceledAt?: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  paidAt?: string;
  dueDate?: string;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
  created: string;
}

export interface CheckoutSessionRequest {
  planType: PlanType;
  interval: BillingInterval;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface CustomerPortalRequest {
  returnUrl?: string;
}

export interface CustomerPortalResponse {
  url: string;
}

export interface CancelSubscriptionRequest {
  reason?: string;
  feedback?: string;
  cancelImmediately?: boolean;
}

export interface BillingDashboardData {
  subscription: Subscription | null;
  upcomingInvoice?: Invoice;
  recentInvoices: Invoice[];
  paymentMethod?: {
    type: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
}

// API Response types
export interface BillingApiSubscriptionDto {
  id: string;
  customer_id: string;
  plan_type: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  interval: string;
  amount: number;
  currency: string;
  trial_end?: string;
  canceled_at?: string;
}

export interface BillingApiInvoiceDto {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  paid_at?: string;
  due_date?: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  created: string;
}
