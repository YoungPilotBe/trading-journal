import { IChangeEvent } from "@rjsf/core";
import Form from "@rjsf/shadcn";
import validator from "@rjsf/validator-ajv8";
import { useState } from "react";
import { customWidgets, schema, uiSchema } from "./strategy.form.schema";

export const StrategyFormExample = () => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleFormChange = (e: IChangeEvent<Record<string, unknown>>) => {
    setFormData(e.formData || {});
  };

  // Create form context with access to form data and onChange
  const formContext = {
    formData,
    onChange: setFormData,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Strategy Form</h2>

      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        onChange={handleFormChange}
        validator={validator}
        widgets={customWidgets}
        formContext={formContext}
      />

      <div className="mt-8 p-4  rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current Form Data:</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
};
