import { NextResponse } from "next/server";
import fs from "fs-extra";
import path from "path";
import { execa } from "execa";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { files } = await req.json();

    const id = uuidv4();
    const projectPath = path.join(process.cwd(), "tmp", id);

    await fs.ensureDir(projectPath);

    // Write files
    for (const file of files) {
      const fullPath = path.join(projectPath, file.path);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content);
    }

    // Install deps
    await execa("npm", ["install"], { cwd: projectPath });

    // Start dev server
    const port = 3001 + Math.floor(Math.random() * 1000);

    execa("npm", ["run", "dev", "--", "-p", port], {
      cwd: projectPath,
      detached: true,
      stdio: "ignore",
    }).unref();

    return NextResponse.json({
      url: `http://localhost:${port}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}