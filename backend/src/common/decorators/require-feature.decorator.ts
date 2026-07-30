import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'feature';

// Usage: @RequireFeature('EXPENSES') — must match a key in Tenant.enabledFeatures.
export const RequireFeature = (feature: string) => SetMetadata(FEATURE_KEY, feature);
