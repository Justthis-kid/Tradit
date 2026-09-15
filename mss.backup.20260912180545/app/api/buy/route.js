import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { price } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (user.credit < price) {
    return NextResponse.json({ error: "Not enough credit" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { credit: { decrement: price } }
  });

  return NextResponse.json({ success: true });
}
