export interface ErrorDetails {
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

export function createErrorResponse(
  type: string,
  details: ErrorDetails,
  status = 400,
): Response {
  const { message, requestId, ...rest } = details;
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        type,
        message,
        details: rest,
        requestId,
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
