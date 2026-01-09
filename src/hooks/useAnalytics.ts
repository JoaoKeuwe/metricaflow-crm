import { useCallback } from 'react';

// Extend window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type EventCategory = 
  | 'auth'
  | 'checkout' 
  | 'subscription'
  | 'lead'
  | 'engagement'
  | 'navigation';

interface TrackEventParams {
  action: string;
  category: EventCategory;
  label?: string;
  value?: number;
  custom_params?: Record<string, unknown>;
}

export function useAnalytics() {
  const isAnalyticsEnabled = typeof window !== 'undefined' && typeof window.gtag === 'function';

  const trackEvent = useCallback(({ action, category, label, value, custom_params }: TrackEventParams) => {
    if (!isAnalyticsEnabled) {
      console.log('[Analytics Dev]', { action, category, label, value, custom_params });
      return;
    }

    window.gtag?.('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...custom_params,
    });
  }, [isAnalyticsEnabled]);

  const trackPageView = useCallback((path: string, title?: string) => {
    if (!isAnalyticsEnabled) {
      console.log('[Analytics Dev] Page view:', path, title);
      return;
    }

    window.gtag?.('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }, [isAnalyticsEnabled]);

  // Auth events
  const trackSignup = useCallback((method: string = 'email') => {
    trackEvent({
      action: 'sign_up',
      category: 'auth',
      label: method,
    });
  }, [trackEvent]);

  const trackLogin = useCallback((method: string = 'email') => {
    trackEvent({
      action: 'login',
      category: 'auth',
      label: method,
    });
  }, [trackEvent]);

  // Checkout/subscription events
  const trackCheckoutStart = useCallback((plan: string, price: number) => {
    trackEvent({
      action: 'begin_checkout',
      category: 'checkout',
      label: plan,
      value: price,
      custom_params: {
        currency: 'BRL',
        items: [{ item_name: plan, price }],
      },
    });
  }, [trackEvent]);

  const trackCheckoutComplete = useCallback((plan: string, price: number, transactionId?: string) => {
    trackEvent({
      action: 'purchase',
      category: 'checkout',
      label: plan,
      value: price,
      custom_params: {
        currency: 'BRL',
        transaction_id: transactionId,
        items: [{ item_name: plan, price }],
      },
    });
  }, [trackEvent]);

  const trackSubscriptionCancel = useCallback((plan: string) => {
    trackEvent({
      action: 'subscription_cancel',
      category: 'subscription',
      label: plan,
    });
  }, [trackEvent]);

  // Lead events
  const trackLeadCreated = useCallback((source?: string) => {
    trackEvent({
      action: 'lead_created',
      category: 'lead',
      label: source,
    });
  }, [trackEvent]);

  const trackLeadConverted = useCallback((value?: number) => {
    trackEvent({
      action: 'lead_converted',
      category: 'lead',
      value: value,
    });
  }, [trackEvent]);

  // Engagement events
  const trackFeatureUsed = useCallback((feature: string) => {
    trackEvent({
      action: 'feature_used',
      category: 'engagement',
      label: feature,
    });
  }, [trackEvent]);

  const trackTrialStarted = useCallback(() => {
    trackEvent({
      action: 'trial_started',
      category: 'subscription',
    });
  }, [trackEvent]);

  const trackOnboardingCompleted = useCallback(() => {
    trackEvent({
      action: 'onboarding_completed',
      category: 'engagement',
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackSignup,
    trackLogin,
    trackCheckoutStart,
    trackCheckoutComplete,
    trackSubscriptionCancel,
    trackLeadCreated,
    trackLeadConverted,
    trackFeatureUsed,
    trackTrialStarted,
    trackOnboardingCompleted,
    isAnalyticsEnabled,
  };
}
