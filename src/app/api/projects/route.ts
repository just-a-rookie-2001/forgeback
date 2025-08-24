import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: fetch all projects for the current user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, prompt } = await req.json();

  if (!name || !prompt) {
    return NextResponse.json(
      { error: "Name and prompt are required" },
      { status: 400 }
    );
  }

  const project = await db.project.create({
    data: {
      name,
      description,
      prompt,
      userId: session.user.id,
      status: "idea",
    },
  });

  // Don't start the workflow automatically - let users explore the project first
  // The workflow can be triggered manually from the project page

  return NextResponse.json(project, { status: 201 });
}
