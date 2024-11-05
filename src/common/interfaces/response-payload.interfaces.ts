export interface ResponsePayload<T> {
  status: string;
  message: string;
  total: number;
  newest: string;
  data: T;
}
