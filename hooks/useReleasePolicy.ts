import { useMemo } from 'react';
import { getReleasePolicy } from '@/services/releasePolicyService';
export function useReleasePolicy() { return useMemo(() => getReleasePolicy(), []); }
