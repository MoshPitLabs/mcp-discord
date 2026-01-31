/**
 * Discord webhook HTTP operations using axios
 */

import axios, { AxiosError } from 'axios';
import type { WebhookMessagePayload, WebhookResponse } from '../types/interfaces.js';

export async function sendWebhookMessage(
  webhookUrl: string,
  payload: WebhookMessagePayload
): Promise<WebhookResponse> {
  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
    });
    
    return {
      success: true,
      statusCode: response.status,
      message: 'Message sent successfully',
      response: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        statusCode: axiosError.response?.status,
        error: extractErrorMessage(axiosError),
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function extractErrorMessage(error: AxiosError): string {
  const status = error.response?.status;
  
  switch (status) {
    case 400:
      return 'Bad request. Check that the message content is valid and within Discord limits.';
    case 401:
      return 'Unauthorized. The webhook URL may be invalid or expired.';
    case 403:
      return 'Forbidden. The webhook may have been deleted or you don\'t have permission.';
    case 404:
      return 'Webhook not found. The webhook URL may be invalid or deleted.';
    case 429:
      return 'Rate limited. Too many requests. Please wait before sending more messages.';
    default:
      return `Discord API returned status ${status}`;
  }
}
