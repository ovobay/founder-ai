import JSZip from "jszip";
import { NextResponse } from "next/server";

function parseFiles(text: string) {
  const files: { path: string; content: string }[] = [];

  const parts = text.split("FILE:");

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    const firstLineEnd = part.indexOf("\n");
    const filePath = part.substring(0, firstLineEnd).trim();
    const content = part.substring(firstLineEnd).trim();

    files.push({ path: filePath, content });
  }

  return files;
}

export async function POST(req: Request) {
  try {
    const { result } = await req.json();

    const zip = new JSZip();
    const files = parseFiles(result);

    files.forEach(({ path, content }) => {
      zip.file(path, content);
    });

    const blob = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=project.zip",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}