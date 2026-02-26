import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rx12p3w1-8080.inc1.devtunnels.ms/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await context.params;
  return proxyRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await context.params;
  return proxyRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await context.params;
  return proxyRequest(request, resolvedParams.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await context.params;
  return proxyRequest(request, resolvedParams.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await context.params;
  return proxyRequest(request, resolvedParams.path, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/');
    
    // Build the full URL with query parameters
    const baseUrl = `${API_BASE_URL}/${path}`;
    const url = new URL(baseUrl);
    
    // Copy all query parameters from the request
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    const finalUrl = url.toString();
    
    console.log(`[Proxy] ${method} ${finalUrl}`);
    console.log(`[Proxy] Query params:`, Object.fromEntries(request.nextUrl.searchParams.entries()));
    
    // Get the request body if it exists
    let body = undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const text = await request.text();
        if (text) {
          body = text;
          console.log(`[Proxy] Request body:`, text);
        }
      } catch (e) {
        console.log(`[Proxy] No body or error reading body:`, e);
      }
    }

    // Forward headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
    };
    
    // Copy authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    console.log(`[Proxy] Request headers:`, headers);

    // Make the request to the backend
    const response = await fetch(finalUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    console.log(`[Proxy] Response status:`, response.status);

    // Get response data
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
      console.log(`[Proxy] Response data (first 500 chars):`, JSON.stringify(data).substring(0, 500));
      
      return NextResponse.json(data, {
        status: response.status,
      });
    } else {
      data = await response.text();
      console.log(`[Proxy] Response text:`, data);
      
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/plain',
        },
      });
    }
  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    console.error('[Proxy] Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Proxy request failed', 
        message: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
