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

    const baseUrl = `${API_BASE_URL}/${path}`;
    const url = new URL(baseUrl);

    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const finalUrl = url.toString();

    // Forward body for all non-GET/HEAD methods (including DELETE)
    let body: string | undefined = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        // Try JSON first, fall back to raw text
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await request.json();
          if (json !== undefined && json !== null) {
            body = JSON.stringify(json);
          }
        } else {
          const text = await request.text();
          if (text) {
            body = text;
          }
        }
      } catch {
        // Ignore body parse errors – send no body
      }
    }

    const headers: HeadersInit = {
      'ngrok-skip-browser-warning': 'true',
    };

    // Only set Content-Type when we actually have a body
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }



    // Make the request to the backend
    const response = await fetch(finalUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
    });



    // Get response data
    let data;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();


      return NextResponse.json(data, {
        status: response.status,
      });
    } else {
      data = await response.text();


      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/plain',
        },
      });
    }
  } catch (error: any) {


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
