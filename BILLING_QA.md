# Billing QA Matrix

## Setup

- Build and run a development build (not Expo Go) for purchase tests.
- Configure RevenueCat keys:
  - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
  - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- Optional QA override:
  - `EXPO_PUBLIC_BILLING_DEBUG_STATE` = `trial_active|free_limited|paid_yearly|paid_lifetime|admin`

## Trial and Free Tier

- [ ] New user with `created_date` today is `trial_active`.
- [ ] User beyond 14 days with no paid plan becomes `free_limited`.
- [ ] Free user can create techniques while count `< 2`.
- [ ] Free user is blocked at count `2` and redirected to `pricing`.
- [ ] Dashboard warning appears when free user reaches the limit.

## Paid Plans

- [ ] Yearly purchase grants `paid_yearly` entitlement and allows unlimited techniques.
- [ ] Lifetime purchase grants `paid_lifetime` entitlement and allows unlimited techniques.
- [ ] Restore purchases recovers yearly/lifetime entitlement after reinstall.
- [ ] Local user state updates with `subscription_plan`, `subscription_status`, and `payment_method`.

## Coupons

- [ ] Valid coupon on yearly plan shows discount confirmation.
- [ ] Valid coupon on lifetime plan shows discount confirmation.
- [ ] Invalid coupon shows a validation message.
- [ ] Coupon input is rejected for free plan.
- [ ] Coupon attempts are stored in AsyncStorage audit trail.

## Migration

- [ ] Existing users with legacy `subscription_status` are normalized on app load.
- [ ] Existing `lifetime` users map to `subscription_plan=lifetime`.
- [ ] Existing `trial` users map to free plan with active trial logic.
- [ ] Existing expired users map to `free_limited`.

## Regression Checks

- [ ] Admin users still access admin-only routes.
- [ ] Non-admin users cannot access admin-only routes.
- [ ] Schedule and other free features remain available to free and trial users.
