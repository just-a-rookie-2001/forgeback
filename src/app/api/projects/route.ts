import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { WorkflowManager } from "@/lib/llm/workflow-manager";

// GET: fetch all projects for the current user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      files: {
        select: { id: true }
      }
    }
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

  // Start the workflow
  const workflowManager = new WorkflowManager();
  workflowManager.startWorkflow(project.id, project.prompt).catch((error) => {
    console.error(`Workflow failed for project ${project.id}:`, error);
    db.project.update({
      where: { id: project.id },
      data: { status: "error" },
    });
  });

  return NextResponse.json(project, { status: 201 });
}