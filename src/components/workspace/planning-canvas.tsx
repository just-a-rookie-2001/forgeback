import { Artifact } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface PlanningCanvasProps {
  artifact: Artifact;
}

export function PlanningCanvas({ artifact }: PlanningCanvasProps) {
  return (
    <div className="h-full flex flex-col p-4 bg-white dark:bg-gray-900">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>{artifact.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <ScrollArea className="h-full">
            <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 p-4">
              {artifact.content}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}