import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function GET() {
  return new Promise((resolve) => {
    exec("node fetchHistory.js", (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ error: stderr }, { status: 500 }));
      }
      resolve(NextResponse.json({ message: "Sync Success", output: stdout }));
    });
  });
}
