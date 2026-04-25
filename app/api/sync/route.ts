import { NextResponse } from "next/server";
import { setupAndFetchHistory } from "@/lib/fetchHistory";

export async function GET(): Promise<NextResponse> {
  try {
    const result = await setupAndFetchHistory();

    // Kembalikan response sukses ke browser/klien
    return NextResponse.json(
      { message: "Sync Success", output: result },
      { status: 200 },
    );
  } catch (error: any) {
    // Tangkap error jika terjadi kegagalan
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
