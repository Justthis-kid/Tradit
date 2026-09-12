import { NextResponse } from "next/server";
import { getUser, addCredit, spendCredit } from "../../../lib/db.js";

export async function GET() {
  return NextResponse.json(getUser());
}

export async function POST(request) {
  const body = await request.json();
  const { action, amount } = body;

  if (action === "add") {
    addCredit(amount || 0);
    return NextResponse.json(getUser());
  }

  if (action === "spend") {
    const ok = spendCredit(amount || 0);
    if (!ok) {
      return NextResponse.json(
        { error: "Not enough credit", user: getUser() },
        { status: 400 }
      );
    }
    return NextResponse.json(getUser());
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
