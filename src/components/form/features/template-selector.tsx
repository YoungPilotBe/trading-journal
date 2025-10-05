import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetTradeTemplates } from "@/hooks/trade_templates/use-get-trade-templates";
import { Link, useNavigate } from "@tanstack/react-router";
import { Doc } from "convex/_generated/dataModel";
import { ChevronRightIcon, PlusIcon, XIcon } from "lucide-react";
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  useFormState,
} from "react-hook-form";

type Props<T extends FieldValues> = {
  field: ControllerRenderProps<T, FieldPath<T>>;
  label: string;
  disabled?: boolean;
};

const TemplateSelector = <T extends FieldValues>({
  field,
  label,
  disabled,
}: Props<T>) => {
  const navigate = useNavigate();
  const { data: templates, isLoading: isLoadingTemplates } =
    useGetTradeTemplates({});

  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  return (
    <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono">
      <label className="text-xs text-muted" htmlFor={field.name}>
        {label}
      </label>
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({
              variant: "outline",
              size: "badge",
              className:
                "text-[10px] justify-between hover:bg-accent hover:text-accent-foreground group-hover:[&:not(:has(.chevron-link:hover))]:bg-accent group-hover:[&:not(:has(.chevron-link:hover))]:text-accent-foreground group-[.chevron-hovered]:bg-transparent group-[.chevron-hovered]:text-inherit transition-colors gap-1",
            })}
            disabled={isLoadingTemplates || disabled}
          >
            {field.value ? (
              <span>
                {templates?.find((t) => t._id === field.value)?.title}
              </span>
            ) : (
              <div className="flex flex-ro items-center gap-2">
                <PlusIcon className="size-2" />
                Add Template
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={0}
            alignOffset={0}
            className="w-60"
          >
            {templates?.map((template: Doc<"trade_templates">) => (
              <DropdownMenuItem
                key={template._id}
                onClick={() => field.onChange(template._id)}
                className="justify-between"
              >
                <span>{template.title}</span>
                {field.value === template._id ? (
                  <button
                    className="p-1 rounded hover:bg-accent/50 hover:text-white text-white/50 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      field.onChange(null);
                    }}
                  >
                    <XIcon className="size-4 text-inherit" />
                  </button>
                ) : (
                  <Link
                    to={"/trade_template"}
                    search={{ templateId: template._id }}
                    className="p-1 rounded hover:bg-accent/50 hover:text-white text-white/50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChevronRightIcon className="size-4 text-inherit" />
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator hidden={!templates?.length} />
            <DropdownMenuItem
              className="justify-between text-emerald-500"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate({
                  to: "/trade_template",
                });
              }}
            >
              <span>Create Template</span>
              <PlusIcon className="size-4 text-inherit" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-center">
        {hasError ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse starting:size-0 transition-all" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">{String(error)}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="w-2 h-2" /> // Placeholder to maintain consistent spacing
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
