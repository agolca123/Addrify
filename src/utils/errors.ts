export class APIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: unknown): never => {
  if (error instanceof APIError) {
    throw error;
  }

  if (error instanceof Response) {
    throw new APIError(
      'API request failed',
      error.status.toString(),
      { statusText: error.statusText }
    );
  }

  throw new APIError('Network error', 'NETWORK_ERROR', error);
};