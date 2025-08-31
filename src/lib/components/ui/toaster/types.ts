export type Toast = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'promise';
  message: string;
  duration: number;
  promise?: Promise<any>;
}
