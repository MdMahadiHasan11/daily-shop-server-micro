export const CACHE_KEYS = {
  userProfile: (userId: string) => `user:profile:${userId}`,
} as const;
