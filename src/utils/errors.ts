/**
 * Centralized error handling and formatting
 */

import { AxiosError } from 'axios';

export function handleError(error: unknown): string {
  if (error instanceof AxiosError) {
    return handleAxiosError(error);
  }
  
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  
  return `Error: ${String(error)}`;
}

function handleAxiosError(error: AxiosError): string {
  const status = error.response?.status;
  
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return 'Error: Request timed out. Discord may be experiencing issues. Please try again.';
  }
  
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return 'Error: Could not connect to Discord. Check your internet connection.';
  }
  
  switch (status) {
    case 400:
      return 'Error: Bad request. Check that the message content is valid and within Discord\'s limits.';
    case 401:
      return 'Error: Unauthorized. The webhook URL may be invalid or expired.';
    case 403:
      return 'Error: Forbidden. The webhook may have been deleted or you don\'t have permission.';
    case 404:
      return 'Error: Webhook not found. The webhook URL may be invalid or deleted.';
    case 429:
      return 'Error: Rate limited. Too many requests. Please wait before sending more messages.';
    default:
      return `Error: Discord API returned status ${status}`;
  }
}
