import { Button } from "@/components/ui/button";
import { useAddTags } from "@/hooks/trade-setup/use-add-tags";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { EffectsProvider } from "@/rjsf/EffectsContext";
import { customWidgets, schema, uiSchema } from "@/rjsf/strategy.form.schema";
import Form from "@rjsf/shadcn";
import validator from "@rjsf/validator-ajv8";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  tradeSetupId: z.string(),
  imageId: z.string(),
});

export const Route = createFileRoute("/trade_onboarding/add_tags")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const { tradeSetupId, imageId } = Route.useSearch();
  const { data: tradeSetup } = useGetTradeSetup({
    id: tradeSetupId as Id<"trade_setups">,
  });
  const navigate = useNavigate();
  const { mutateAsync: addTags, isPending } = useAddTags();
  const [formData, setFormData] = useState();

  useEffect(() => {
    if (!tradeSetup?.tags) return;
    setFormData(tradeSetup.tags);
  }, [tradeSetup?.tags]);

  const onSubmit = async () => {
    // Add tags to the existing trade setup
    await addTags({
      id: tradeSetupId as Id<"trade_setups">,
      tags: formData,
    });

    // Navigate to a success page or back to the main app
    navigate({
      to: "/trade_onboarding/add_timeframes",
      search: { imageId, tradeSetupId },
    });
  };

  if (!tradeSetup) {
    return <div>Loading trade setup...</div>;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - similar to add_trade layout */}
      <div className="absolute right-[60%] left-[10%] top-[20%] bottom-[20%] h-auto max-h-[70vh] max-w-[25vw] min-w-[700px] pointer-events-auto ">
        <div className="flex flex-col items-start space-y-2 mt-2">
          <span className="text-white font-light font-mono">Tags</span>
          <EffectsProvider tradeSetup={tradeSetup}>
            <Form
              schema={schema}
              uiSchema={uiSchema}
              formData={formData}
              onChange={(e) => {
                setFormData(e.formData);
              }}
              onSubmit={() => {
                onSubmit();
              }}
              validator={validator}
              widgets={customWidgets}
              children={true} // This removes the default submit button
            />
          </EffectsProvider>
        </div>

        <Button
          className="absolute bottom-0 right-0 translate-x-full duration-500 ease-out font-mono tracking-wide leading-3"
          onClick={onSubmit}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Proceed"}
        </Button>
      </div>
    </div>
  );
}
