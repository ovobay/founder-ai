import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { files } = await req.json();

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided to preview route." },
        { status: 400 }
      );
    }

    const previewWorkerUrl =
      process.env.PREVIEW_WORKER_URL || "http://localhost:5050";

    const workerResponse = await fetch(`${previewWorkerUrl}/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files }),
    });

    let data: any = null;

    try {
      data = await workerResponse.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Preview worker returned a non-JSON response. Check the preview-worker terminal.",
          raw_status: workerResponse.status,
        },
        { status: 500 }
      );
    }

    if (!workerResponse.ok) {
      return NextResponse.json(
        {
          error: data.error || "Preview worker failed.",
          reason: data.reason || null,
          url: data.url || null,
          status: data.status || null,
          htmlSnippet: data.htmlSnippet || null,
          logs: data.logs || null,
          pageFile: data.pageFile || null,
          layoutFile: data.layoutFile || null,
          container: data.container || null,
          worker_status: workerResponse.status,
        },
        { status: workerResponse.status }
      );
    }

    return NextResponse.json({
      url: data.url,
      container: data.container || null,
      expires_in_seconds: data.expires_in_seconds || 600,
      htmlSnippet: data.htmlSnippet || null,
      logs: data.logs || null,
      pageFile: data.pageFile || null,
      layoutFile: data.layoutFile || null,
      warning: data.warning || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Preview route failed: ${String(error)}`,
      },
      { status: 500 }
    );
  }
}