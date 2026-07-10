import { SetMetadata } from '@nestjs/common';

export const ALLOW_PORTAL_SUSPENDED_KEY = 'allowPortalSuspended';

export const AllowWhenPortalSuspended = () => SetMetadata(ALLOW_PORTAL_SUSPENDED_KEY, true);
