import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { submissionId } = await req.json();

  const submission = await prisma.shoeSubmission.findUnique({
    where: { id: submissionId }
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { credit: { increment: submission.creditOffer } }
  });

  return NextResponse.json({ success: true });
}
