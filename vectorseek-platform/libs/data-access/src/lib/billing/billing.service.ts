import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, map, catchError } from 'rxjs';

import { BILLING_API_ENDPOINTS } from './billing.api';
import {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  Subscription,
  Invoice,
  CustomerPortalRequest,
  CustomerPortalResponse,
  CancelSubscriptionRequest,
  BillingDashboardData,
  BillingApiSubscriptionDto,
  BillingApiInvoiceDto,
  PlanType,
  SubscriptionStatus,
  BillingInterval
} from './billing.models';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);

  /**
   * Create a Stripe Checkout session
   */
  createCheckoutSession(request: CheckoutSessionRequest): Observable<CheckoutSessionResponse> {
    return this.http
      .post<CheckoutSessionResponse>(BILLING_API_ENDPOINTS.createCheckoutSession(), {
        plan_type: request.planType,
        interval: request.interval,
        success_url: request.successUrl || `${window.location.origin}/billing/success`,
        cancel_url: request.cancelUrl || `${window.location.origin}/billing/cancel`
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get current subscription
   */
  getSubscription(): Observable<Subscription | null> {
    return this.http
      .get<BillingApiSubscriptionDto | null>(BILLING_API_ENDPOINTS.getSubscription())
      .pipe(
        map(dto => dto ? this.mapSubscriptionFromDto(dto) : null),
        catchError(this.handleError)
      );
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(request?: CancelSubscriptionRequest): Observable<Subscription> {
    return this.http
      .post<BillingApiSubscriptionDto>(BILLING_API_ENDPOINTS.cancelSubscription(), {
        reason: request?.reason,
        feedback: request?.feedback,
        cancel_immediately: request?.cancelImmediately || false
      })
      .pipe(
        map(dto => this.mapSubscriptionFromDto(dto)),
        catchError(this.handleError)
      );
  }

  /**
   * Get Customer Portal URL
   */
  getCustomerPortalUrl(request?: CustomerPortalRequest): Observable<CustomerPortalResponse> {
    return this.http
      .post<CustomerPortalResponse>(BILLING_API_ENDPOINTS.getCustomerPortalUrl(), {
        return_url: request?.returnUrl || window.location.href
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get invoices
   */
  getInvoices(): Observable<Invoice[]> {
    return this.http
      .get<BillingApiInvoiceDto[]>(BILLING_API_ENDPOINTS.getInvoices())
      .pipe(
        map(dtos => dtos.map(dto => this.mapInvoiceFromDto(dto))),
        catchError(this.handleError)
      );
  }

  /**
   * Get single invoice
   */
  getInvoice(invoiceId: string): Observable<Invoice> {
    return this.http
      .get<BillingApiInvoiceDto>(BILLING_API_ENDPOINTS.getInvoice(invoiceId))
      .pipe(
        map(dto => this.mapInvoiceFromDto(dto)),
        catchError(this.handleError)
      );
  }

  /**
   * Get dashboard data (subscription + invoices + payment method)
   */
  getDashboardData(): Observable<BillingDashboardData> {
    return this.http
      .get<any>(BILLING_API_ENDPOINTS.getDashboardData())
      .pipe(
        map(data => ({
          subscription: data.subscription ? this.mapSubscriptionFromDto(data.subscription) : null,
          upcomingInvoice: data.upcoming_invoice ? this.mapInvoiceFromDto(data.upcoming_invoice) : undefined,
          recentInvoices: (data.recent_invoices || []).map((dto: BillingApiInvoiceDto) => this.mapInvoiceFromDto(dto)),
          paymentMethod: data.payment_method ? {
            type: data.payment_method.type,
            last4: data.payment_method.last4,
            expiryMonth: data.payment_method.expiry_month,
            expiryYear: data.payment_method.expiry_year
          } : undefined
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Redirect to Stripe Checkout
   */
  redirectToCheckout(sessionUrl: string): void {
    window.location.href = sessionUrl;
  }

  /**
   * Redirect to Customer Portal
   */
  redirectToCustomerPortal(portalUrl: string): void {
    window.location.href = portalUrl;
  }

  // Mappers

  private mapSubscriptionFromDto(dto: BillingApiSubscriptionDto): Subscription {
    return {
      id: dto.id,
      customerId: dto.customer_id,
      planType: dto.plan_type as PlanType,
      status: dto.status as SubscriptionStatus,
      currentPeriodStart: dto.current_period_start,
      currentPeriodEnd: dto.current_period_end,
      cancelAtPeriodEnd: dto.cancel_at_period_end,
      interval: dto.interval as BillingInterval,
      amount: dto.amount,
      currency: dto.currency,
      trialEnd: dto.trial_end,
      canceledAt: dto.canceled_at
    };
  }

  private mapInvoiceFromDto(dto: BillingApiInvoiceDto): Invoice {
    return {
      id: dto.id,
      number: dto.number,
      status: dto.status as 'paid' | 'open' | 'void' | 'uncollectible',
      amount: dto.amount,
      currency: dto.currency,
      paidAt: dto.paid_at,
      dueDate: dto.due_date,
      invoicePdf: dto.invoice_pdf,
      hostedInvoiceUrl: dto.hosted_invoice_url,
      created: dto.created
    };
  }

  // Error handling

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'BILLING.ERRORS.UNKNOWN';

    if (error.status === 400) {
      errorMessage = 'BILLING.ERRORS.BAD_REQUEST';
    } else if (error.status === 401) {
      errorMessage = 'BILLING.ERRORS.UNAUTHORIZED';
    } else if (error.status === 403) {
      errorMessage = 'BILLING.ERRORS.FORBIDDEN';
    } else if (error.status === 404) {
      errorMessage = 'BILLING.ERRORS.NOT_FOUND';
    } else if (error.status === 409) {
      errorMessage = 'BILLING.ERRORS.CONFLICT';
    } else if (error.status >= 500) {
      errorMessage = 'BILLING.ERRORS.SERVER_ERROR';
    } else if (error.status === 0) {
      errorMessage = 'BILLING.ERRORS.NETWORK_ERROR';
    }

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      originalError: error
    }));
  }
}
