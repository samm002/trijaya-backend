import { ResponsePayload } from '@common/interfaces';

export function successResponsePayload<T>(
  message: string,
  data: T,
  total?: number,
  newest?: string,
): ResponsePayload<T> {
  return {
    status: 'success',
    message,
    total: total,
    newest: newest,
    data,
  };
}
