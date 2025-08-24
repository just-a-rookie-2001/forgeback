"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectActions } from "../../../../components/workspace/project-actions";
import { WorkspaceGrid } from "../../../../components/workspace/workspace-grid";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Calendar, FileCode, ChevronDown } from "lucide-react";
import {
  type Project,
  Stage,
  Artifact,
  StageType,
} from "@prisma/client";

type FullProject = Project & {
  stages: (Stage & {
    artifacts: Artifact[];
  })[];
};

interface ProjectPageClientProps {
  project: FullProject;
}

const stageConfig = {
    [StageType.PLANNING]: { 
        name: "Planning", 
        icon: "📋", 
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", 
        description: "Define goals and requirements" 
    },
    [StageType.DESIGN]: { 
        name: "Design", 
        icon: "🎨", 
        color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200", 
        description: "Create architecture and models" 
    },
    [StageType.DEVELOPMENT]: { 
        name: "Development", 
        icon: "💻", 
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
        description: "Write and test code" 
    },
    [StageType.TESTING]: { 
        name: "Testing", 
        icon: "🧪", 
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
        description: "Ensure quality and fix bugs" 
    },
    [StageType.DEPLOYMENT]: { 
        name: "Deployment", 
        icon: "🚀", 
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", 
        description: "Release to production" 
    },
};

export function Project({ project }: ProjectPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get available stages
  const availableStages = Object.values(StageType);

  // Get current stage from URL or default to first available
  const currentStageParam = searchParams.get('stage') as StageType;
  const [activeStage, setActiveStage] = useState<StageType>(
    currentStageParam && availableStages.includes(currentStageParam) 
      ? currentStageParam 
      : availableStages[0] || StageType.PLANNING
  );

  // Update URL when stage changes
  const handleStageChange = (stage: StageType) => {
    setActiveStage(stage);
    const url = new URL(window.location.href);
    url.searchParams.set('stage', stage);
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Sync with URL changes
  useEffect(() => {
    const stageFromUrl = searchParams.get('stage') as StageType;
    if (stageFromUrl && availableStages.includes(stageFromUrl) && stageFromUrl !== activeStage) {
      setActiveStage(stageFromUrl);
    }
  }, [searchParams, availableStages, activeStage]);

  // Current stage config
  const currentStageConfig = stageConfig[activeStage];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            
            {/* Stage Selector Dropdown */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2 min-w-[160px] justify-between border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{currentStageConfig.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentStageConfig.name}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-0">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
                      Select Stage
                    </div>
                  </div>
                  <div className="py-1">
                    {availableStages.map((stage) => {
                      const config = stageConfig[stage];
                      const isActive = stage === activeStage;
                      return (
                        <DropdownMenuItem
                          key={stage}
                          onClick={() => handleStageChange(stage)}
                          className={`flex items-center gap-3 mx-1 rounded ${
                            isActive 
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <span className="text-lg shrink-0">{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {config.name}
                              </span>
                              {isActive && (
                                <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 ml-2"></div>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {config.description}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <ProjectActions project={project} />
        </div>

        {project.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {project.description}
          </p>
        )}
      </div>

      <WorkspaceGrid project={project} activeStage={activeStage} />
    </div>
  );
}
