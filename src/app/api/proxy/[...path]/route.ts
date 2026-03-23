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
    let body: any = undefined;
    let contentType = request.headers.get('content-type') || '';

    if (method !== 'GET' && method !== 'HEAD') {
      try {
        if (contentType.includes('application/json')) {
          const json = await request.json();
          if (json !== undefined && json !== null) {
            body = JSON.stringify(json);
          }
        } else if (contentType.includes('multipart/form-data')) {
          // For multipart, get the raw body as an arrayBuffer to preserve the boundary
          body = await request.arrayBuffer();
        } else {
          const text = await request.text();
          if (text) {
            body = text;
          }
        }
      } catch (error) {
        console.error('Proxy body parse error:', error);
      }
    }

    const headers: HeadersInit = {
      'ngrok-skip-browser-warning': 'true',
    };

    // Forward the original Content-Type if it exists, otherwise default to JSON if we have a body
    if (contentType) {
      headers['Content-Type'] = contentType;
    } else if (body && typeof body === 'string') {
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



    // Handle response (including 204 No Content)
    const responseContentType = response.headers.get('content-type') || '';

    if (response.status === 204) {
      // 204 must not include a body; returning JSON/any body can throw.
      return new NextResponse(null, { status: 204 });
    }

    const responseText = await response.text();
    const isJson = responseContentType.includes('application/json');

    if (isJson) {
      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          return NextResponse.json(parsed, { status: response.status });
        } catch {
          // Backend claims JSON but body isn't valid JSON; pass raw text through.
          return new NextResponse(responseText, {
            status: response.status,
            headers: {
              'Content-Type': responseContentType || 'application/json',
            },
          });
        }
      }

      // Content-Type says JSON, but body is empty.
      return new NextResponse(null, { status: response.status });
    }

    // Non-JSON or unknown content-type: pass raw text through.
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': responseContentType || 'text/plain',
      },
    });
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
