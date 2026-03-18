# Billing Setup Notes

## RevenueCat Product Mapping

- Yearly product ID: `matmind_yearly`
- Lifetime product ID: `matmind_lifetime`

These product IDs are mapped in `constants/billing.ts`.

## Environment Variables

Set these for development and production builds:

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

Optional QA override (forces entitlement state):

- `EXPO_PUBLIC_BILLING_DEBUG_STATE`
  - Allowed values: `trial_active`, `free_limited`, `paid_yearly`, `paid_lifetime`, `admin`

## Expo Plugin

`app.json` includes:

- `"react-native-purchases"`

This is required for native RevenueCat integration in Expo prebuild/dev builds.
