import { NextRequest, NextResponse } from "next/server";

async function handleProxy(request: NextRequest, pathStr: string) {
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:3001";

  // Diagnostic endpoint to verify proxy deployment on Vercel
  if (pathStr === "health/debug") {
    return NextResponse.json({
      status: "ok",
      proxy: "working",
      backendUrl: backendUrl.replace(/\d+\.\d+\.\d+\.\d+/, "xxx.xxx.xxx.xxx"), // mask IP for safety
      timestamp: new Date().toISOString()
    });
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const targetUrl = `${backendUrl}/api/${pathStr}${searchParams ? `?${searchParams}` : ""}`;

  const headers = new Headers();
  // Copy relevant headers from incoming request
  const headersToForward = ["content-type", "authorization", "accept"];
  for (const h of headersToForward) {
    const val = request.headers.get(h);
    if (val) {
      headers.set(h, val);
    }
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  // Only attach body if request method is not GET or HEAD
  if (request.method !== "GET" && request.method !== "HEAD" && request.body) {
    fetchOptions.body = request.body;
    // @ts-ignore
    fetchOptions.duplex = "half"; // Required for forwarding request.body streams in Node/Next
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);

    // Create headers for the proxy response
    const responseHeaders = new Headers();
    const headersToReturn = ["content-type", "cache-control"];
    for (const h of headersToReturn) {
      const val = response.headers.get(h);
      if (val) {
        responseHeaders.set(h, val);
      }
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Proxy error for ${targetUrl}:`, error);
    return NextResponse.json(
      { success: false, error: `Proxy failed: ${error.message}` },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path.join("/"));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path.join("/"));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path.join("/"));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path.join("/"));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path.join("/"));
}
