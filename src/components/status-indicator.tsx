import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

interface StatusIndicatorProps {
  isConnected: boolean;
  server: string;
  description?: string;
  showDescription?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isConnected,
  server,
  description,
  showDescription = false,
}) => {
  const content = (
    <Badge
      variant="outline"
      className={`
        cursor-default rounded-none px-2 py-1 text-xs font-medium
        bg-gradient-to-t from-background to-sidebar border-muted
        text-gray-100 shadow-sm
        hover:from-muted hover:to-accent transition-all duration-200
        flex items-center space-x-2 w-fit
      `}
    >
      {/* Status dot with pulse animation when connected */}
      <div className="relative flex items-center">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? "bg-emerald-400" : "bg-red-400"
          } ${isConnected ? "animate-pulse" : ""}`}
        />
        {isConnected && (
          <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
        )}
      </div>

      {/* Server name */}
      <span className="font-mono text-gray-100 text-[10px] tracking-wide">
        {server}
      </span>

      {/* Optional description when showDescription is true */}
      {showDescription && description && (
        <span className="text-gray-400">• {description}</span>
      )}
    </Badge>
  );

  // If no description for tooltip, return content without tooltip
  if (!description || showDescription) {
    return content;
  }

  // Wrap with tooltip when description exists and showDescription is false
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{content}</TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={10}
          className="bg-gradient-to-t from-background to-sideba text-gray-100"
        >
          <div className="flex items-center space-x-2  font-mono">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            <span className="text-[11px]">
              {server} • {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          {description && (
            <p className="text-[10px] text-gray-400 mt-1">{description}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StatusIndicator;
