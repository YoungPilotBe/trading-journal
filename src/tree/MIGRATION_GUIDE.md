# Tree System Refactoring - Migration Guide

## Overview

The tree system has been refactored from a plain object/interface-based system to a class-based architecture for better encapsulation, type safety, and maintainability.

## What Changed

### Before (Old System)

- `TreeNode` was a plain TypeScript interface
- Logic was scattered across `tree.utils.ts`, `TreeContext.tsx`, and `Tree.tsx`
- All properties (visual, structural, metadata) were mixed together
- Grid positioning was computed on every render
- Tree operations were standalone functions

### After (New System)

- `TreeNode` is a class with encapsulated methods
- Logic is organized into three main classes:
  - `TreeNode` - Core tree structure and navigation
  - `TreeState` - Selection and expansion state management
  - `TreeGrid` - Grid positioning and rendering layout
- Metadata is separated from core structure in `metadata` property
- Better type safety with TypeScript features

## New File Structure

```
src/tree/
├── TreeNode.class.ts         # Core TreeNode class
├── TreeGrid.class.ts          # Grid positioning logic
├── TreeState.class.ts         # State management
├── tree.utils.new.ts          # Utilities and factories
├── TreeContext.new.tsx        # Updated context
├── tree.new.tsx              # Updated Tree component
├── strategies/
│   └── idea.constants.new.ts # Updated strategy factory
└── MIGRATION_GUIDE.md        # This file
```

## Key Features Retained

✅ All existing features are preserved:

- ToggleBadge visual style
- Grid-like display (left to right)
- Anti-selection logic (deselects conflicting nodes)
- Input field support
- Tree expansion/collapse
- Selection tracking
- Tag JSON generation

## Key Improvements

### 1. **Metadata Separation**

**Before:**

```typescript
const node = {
  key: "swing",
  title: "Swing",
  icon: Activity,
  iconClassName: "text-emerald-500",
  description: "...",
  imageUrl: "...",
  // ... more mixed properties
};
```

**After:**

```typescript
const node = new TreeNode({
  key: "swing",
  title: "Swing",
  metadata: {
    icon: Activity,
    iconClassName: "text-emerald-500",
    description: "...",
    imageUrl: "...",
    // All visual/config properties here
  },
});
```

### 2. **Encapsulated Methods**

**Before:**

```typescript
// Standalone functions
const path = findNodePath(tree, nodeKey);
const depth = getTreeDepth(tree);
const node = findNodeByKey(tree, nodeKey);
```

**After:**

```typescript
// Methods on the TreeNode instance
const path = node.getPath();
const depth = node.getDepth();
const foundNode = node.findNode(nodeKey);
```

### 3. **State Management**

**Before:**

```typescript
// State managed in context with utility functions
const result = toggleBranchWithAntiSelection(
  tree,
  selectedNodes,
  expandedKeys,
  nodeKey
);
```

**After:**

```typescript
// State managed by TreeState class
const treeState = new TreeState(trees, initialState);
treeState.toggleNode(nodeKey, isBranch, hasAntiSelection);
const currentState = treeState.getState();
```

### 4. **Type Safety**

The class-based system provides better TypeScript type safety:

- Compile-time checks for method calls
- Proper encapsulation with readonly/private properties
- Generic type support for strategy factories

## Migration Steps

### Step 1: Update Imports

**Before:**

```typescript
import type { TreeNode } from "./tree.utils";
import { findNodePath, getTreeDepth } from "./tree.utils";
```

**After:**

```typescript
import { TreeNode } from "./tree.utils.new";
import type { TreeNodeConfig } from "./tree.utils.new";
```

### Step 2: Update TreeNode Creation

**Before:**

```typescript
const tree: TreeNode = {
  key: "root",
  title: "Root",
  icon: Activity,
  children: [...]
}
```

**After:**

```typescript
const tree = new TreeNode({
  key: "root",
  title: "Root",
  metadata: {
    icon: Activity,
  },
  children: [...]
})
```

### Step 3: Update Strategy Factories

**Before:**

```typescript
export const createMyStrategy = (config): TreeNode[] => {
  return [
    {
      key: "node1",
      title: "Node 1",
      children: [...]
    }
  ]
}
```

**After:**

```typescript
export const createMyStrategy: StrategyFactory<MyConfig> = (config): TreeNode[] => {
  return [
    new TreeNode({
      key: "node1",
      title: "Node 1",
      children: [...]
    })
  ]
}
```

### Step 4: Update Context Usage

**Before:**

```typescript
import { TreeProvider } from "./TreeContext";
import { useTreeState, useTreeToggle } from "./TreeContext";

const treeState = useTreeState();
const { strategy } = useTreeToggle();
```

**After:**

```typescript
import { TreeProvider } from "./TreeContext.new";
import { useTreeStateValue, useTreeManagers } from "./TreeContext.new";

const treeState = useTreeStateValue();
const { trees, treeGrid } = useTreeManagers();
```

### Step 5: Update Tree Component Import

**Before:**

```typescript
import { Tree } from "./tree";
```

**After:**

```typescript
import { Tree } from "./tree.new";
```

## API Reference

### TreeNode Class

```typescript
class TreeNode {
  // Core properties
  readonly key: string;
  readonly title: string;
  readonly metadata: TreeNodeMetadata;
  readonly children: ReadonlyArray<TreeNode>;
  readonly parent: TreeNode | null;

  // Getters
  get isLeaf(): boolean;
  get hasChildren(): boolean;
  get antiKeys(): string[];

  // Navigation methods
  getDepth(): number;
  getPath(): string[];
  getPathWithoutRoot(): string[];
  getRoot(): TreeNode;
  findNode(key: string): TreeNode | null;
  getAllDescendantKeys(): string[];
  getAllDescendants(): TreeNode[];

  // Manipulation methods (for future use)
  addChild(node: TreeNode, index?: number): void;
  removeChild(key: string): boolean;
  addSibling(node: TreeNode, position: "before" | "after"): boolean;
  removeSibling(key: string): boolean;

  // Anti-selection
  getAntiKeysWithDescendants(): string[];

  // Utility
  clone(): TreeNode;
  toJSON(): TreeNodeConfig;
  static fromJSON(config: TreeNodeConfig): TreeNode;
}
```

### TreeState Class

```typescript
class TreeState {
  constructor(trees: TreeNode[], initialState?: Partial<ITreeState>);

  // Getters
  getExpandedKeys(): Set<string>;
  getSelectedNodes(): Set<string>;
  getTags(): Record<string, unknown>;
  getState(): ITreeState;

  // State updates
  updateState(newState: Partial<ITreeState>): void;

  // Operations
  toggleNode(
    nodeKey: string,
    isBranch: boolean,
    hasAntiSelection: boolean
  ): ITreeState;
  saveInputField(nodeKey: string, values: Record<string, unknown>): ITreeState;
  getNestedValue(path: string[]): Record<string, unknown> | undefined;
}
```

### TreeGrid Class

```typescript
class TreeGrid {
  constructor(trees: TreeNode[]);

  getMaxDepth(): number;
  toGrid(expandedKeys: Set<string>, selectedNodes: Set<string>): GridCell[][];
  getNodePosition(
    nodeKey: string,
    expandedKeys: Set<string>,
    selectedNodes: Set<string>
  ): { row: number; col: number } | null;
}
```

## Future Features (Ready to Implement)

The new class-based system makes these features easy to add:

### 1. Dynamic Node Addition/Removal

```typescript
// Add child
const newChild = new TreeNode({ key: "new", title: "New Node" });
parentNode.addChild(newChild);

// Remove child
parentNode.removeChild("childKey");

// Add sibling
node.addSibling(siblingNode, "after");
```

### 2. Tree Transformation

```typescript
// Clone a subtree
const clonedNode = node.clone();

// Serialize to JSON
const json = node.toJSON();

// Deserialize from JSON
const restoredNode = TreeNode.fromJSON(json);
```

### 3. Advanced Queries

```typescript
// Check ancestry
if (node.isAncestorOf(otherNode)) { ... }

// Get level in tree
const level = node.getLevel()

// Get all descendants
const descendants = node.getAllDescendants()
```

## Backward Compatibility

To ease migration, the old files are kept intact:

- `tree.utils.ts` (old)
- `TreeContext.tsx` (old)
- `tree.tsx` (old)
- `strategies/idea.constants.ts` (old)

New files use `.new` suffix or separate file names. Once migration is complete and tested, you can:

1. Delete old files
2. Rename new files (remove `.new` suffix)
3. Update all imports

## Testing Checklist

After migration, verify:

- [ ] Tree renders correctly
- [ ] Nodes expand/collapse properly
- [ ] Selection works (clicking nodes)
- [ ] Anti-selection deselects conflicting nodes
- [ ] Input fields appear for leaf nodes with inputField config
- [ ] Input field data saves correctly
- [ ] Tags JSON is generated properly
- [ ] Tree state persists/restores correctly
- [ ] Grid layout displays correctly

## Questions or Issues?

If you encounter any issues during migration:

1. Check that TreeNode instances are created with `new TreeNode(...)`
2. Verify all properties are in the `metadata` object
3. Ensure TreeProvider is using the new context
4. Confirm Tree component is imported from the new file

## Benefits Summary

✅ **Better Organization**: Logic is properly encapsulated in classes
✅ **Type Safety**: Stronger compile-time guarantees
✅ **Maintainability**: Easier to understand and modify
✅ **Extensibility**: Easy to add new features
✅ **Performance**: Grid positioning can be optimized
✅ **Developer Experience**: Better IDE autocomplete and error messages
