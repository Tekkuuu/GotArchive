export interface ApiErrorResponse {
  error: {
    message: string;
    sentryErrorId?: string;
  }
}
