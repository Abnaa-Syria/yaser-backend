const envFlag = (name: string, defaultValue: boolean) => {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const platformFeatures = {
  wallet: envFlag('FEATURE_WALLET', false),
  communityEvents: envFlag('FEATURE_COMMUNITY_EVENTS', false),
  publicInstructorCatalog: envFlag('FEATURE_PUBLIC_INSTRUCTOR_CATALOG', false),
  instructorSelfService: envFlag('FEATURE_INSTRUCTOR_SELF_SERVICE', false),
  privateBooking: envFlag('FEATURE_PRIVATE_BOOKING', false),
  multiInstructor: envFlag('FEATURE_MULTI_INSTRUCTOR', false),
};

export type PlatformFeature = keyof typeof platformFeatures;
