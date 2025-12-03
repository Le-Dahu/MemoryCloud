import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  return jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
