import Tree from "@/tree/tree";
import { TreeProvider } from "@/tree/TreeContext";

const Tags = () => {
  return (
    <TreeProvider>
      <Tree />
    </TreeProvider>
  );
};

export default Tags;
