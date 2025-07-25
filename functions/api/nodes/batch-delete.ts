import { handleNodesBatchDelete } from '../../core/nodes-batch-delete';
import { Env } from '@shared/types';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  return handleNodesBatchDelete(request, env);
};