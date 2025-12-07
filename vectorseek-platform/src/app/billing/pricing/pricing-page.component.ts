import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { BillingService, PricingPlan, BillingPlanType, BillingInterval } from '@vectorseek/data-access';
import { AuthStore } from '../../../../libs/state/src/lib/auth/auth.store';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './pricing-page.component.html',
  styleUrls: ['./pricing-page.component.css']
})
export class PricingPageComponent implements OnInit {
  private billingService = inject(BillingService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  plans = signal<PricingPlan[]>([]);
  selectedInterval = signal<BillingInterval>(BillingInterval.MONTHLY);
  isLoading = signal(false);
  error = signal<string | null>(null);
  currentPlan = signal<BillingPlanType | null>(null);

  readonly BillingInterval = BillingInterval;

  ngOnInit() {
    this.loadPlans();
    this.loadCurrentSubscription();
  }

  private loadPlans() {
    // Define pricing plans (could also come from API)
    const plans: PricingPlan[] = [
      {
        id: 'free',
        name: 'BILLING.PLANS.FREE.NAME',
        type: BillingPlanType.FREE,
        description: 'BILLING.PLANS.FREE.DESCRIPTION',
        price: {
          monthly: 0,
          yearly: 0
        },
        features: [
          { name: 'BILLING.FEATURES.DOCUMENTS', included: true, limit: '10' },
          { name: 'BILLING.FEATURES.QNA', included: true, limit: '50/month' },
          { name: 'BILLING.FEATURES.GENERATION', included: false },
          { name: 'BILLING.FEATURES.ANALYTICS', included: false },
          { name: 'BILLING.FEATURES.SUPPORT', included: false }
        ],
        cta: 'BILLING.CTA.GET_STARTED'
      },
      {
        id: 'professional',
        name: 'BILLING.PLANS.PROFESSIONAL.NAME',
        type: BillingPlanType.PROFESSIONAL,
        description: 'BILLING.PLANS.PROFESSIONAL.DESCRIPTION',
        price: {
          monthly: 29,
          yearly: 290
        },
        features: [
          { name: 'BILLING.FEATURES.DOCUMENTS', included: true, limit: '100' },
          { name: 'BILLING.FEATURES.QNA', included: true, limit: 'unlimited' },
          { name: 'BILLING.FEATURES.GENERATION', included: true, limit: '50/month' },
          { name: 'BILLING.FEATURES.ANALYTICS', included: true },
          { name: 'BILLING.FEATURES.SUPPORT', included: true, limit: 'email' }
        ],
        popular: true,
        cta: 'BILLING.CTA.SUBSCRIBE'
      },
      {
        id: 'business',
        name: 'BILLING.PLANS.BUSINESS.NAME',
        type: BillingPlanType.BUSINESS,
        description: 'BILLING.PLANS.BUSINESS.DESCRIPTION',
        price: {
          monthly: 99,
          yearly: 990
        },
        features: [
          { name: 'BILLING.FEATURES.DOCUMENTS', included: true, limit: 'unlimited' },
          { name: 'BILLING.FEATURES.QNA', included: true, limit: 'unlimited' },
          { name: 'BILLING.FEATURES.GENERATION', included: true, limit: 'unlimited' },
          { name: 'BILLING.FEATURES.ANALYTICS', included: true },
          { name: 'BILLING.FEATURES.SUPPORT', included: true, limit: 'priority' },
          { name: 'BILLING.FEATURES.TEAM', included: true, limit: '10 users' }
        ],
        cta: 'BILLING.CTA.SUBSCRIBE'
      },
      {
        id: 'enterprise',
        name: 'BILLING.PLANS.ENTERPRISE.NAME',
        type: BillingPlanType.ENTERPRISE,
        description: 'BILLING.PLANS.ENTERPRISE.DESCRIPTION',
        price: {
          monthly: 0,
          yearly: 0
        },
        features: [
          { name: 'BILLING.FEATURES.EVERYTHING', included: true },
          { name: 'BILLING.FEATURES.CUSTOM_INTEGRATION', included: true },
          { name: 'BILLING.FEATURES.DEDICATED_SUPPORT', included: true },
          { name: 'BILLING.FEATURES.SLA', included: true },
          { name: 'BILLING.FEATURES.TRAINING', included: true }
        ],
        cta: 'BILLING.CTA.CONTACT_SALES'
      }
    ];

    this.plans.set(plans);
  }

  private loadCurrentSubscription() {
    // Load current user's subscription to highlight current plan
    const user = this.authStore.user();
    if (user) {
      this.billingService.getSubscription().subscribe({
        next: (subscription) => {
          if (subscription) {
            this.currentPlan.set(subscription.planType);
          }
        },
        error: (error) => {
          console.error('Error loading subscription:', error);
        }
      });
    }
  }

  toggleInterval() {
    this.selectedInterval.update(current =>
      current === BillingInterval.MONTHLY ? BillingInterval.YEARLY : BillingInterval.MONTHLY
    );
  }

  getPrice(plan: PricingPlan): number {
    return this.selectedInterval() === BillingInterval.MONTHLY
      ? plan.price.monthly
      : plan.price.yearly;
  }

  getYearlySavings(plan: PricingPlan): number {
    const monthlyTotal = plan.price.monthly * 12;
    const yearlyTotal = plan.price.yearly;
    return monthlyTotal - yearlyTotal;
  }

  isCurrentPlan(plan: PricingPlan): boolean {
    return this.currentPlan() === plan.type;
  }

  async onSelectPlan(plan: PricingPlan) {
    // Check if user is logged in
    const user = this.authStore.user();
    if (!user) {
      // Redirect to login
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/pricing' }
      });
      return;
    }

    // Handle Enterprise (custom pricing)
    if (plan.type === BillingPlanType.ENTERPRISE) {
      // TODO: Open contact form or redirect to sales page
      window.location.href = 'mailto:sales@vectorseek.com';
      return;
    }

    // Handle Free plan
    if (plan.type === BillingPlanType.FREE) {
      // User is already on free plan or wants to downgrade
      this.router.navigate(['/app/billing']);
      return;
    }

    // Create checkout session
    this.isLoading.set(true);
    this.error.set(null);

    this.billingService.createCheckoutSession({
      planType: plan.type,
      interval: this.selectedInterval(),
      successUrl: `${window.location.origin}/billing/success`,
      cancelUrl: `${window.location.origin}/pricing`
    }).subscribe({
      next: (response) => {
        // Redirect to Stripe Checkout
        this.billingService.redirectToCheckout(response.url);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.error.set(error.message || 'BILLING.ERRORS.CHECKOUT_FAILED');
        console.error('Checkout error:', error);
      }
    });
  }
}
