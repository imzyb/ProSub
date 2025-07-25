import { handleSubscriptionsUpdate } from '../../../core/subscriptions-update';
import { Env } from '@shared/types';

export const onRequestPost = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  return handleSubscriptionsUpdate(request, env, params.id);
};