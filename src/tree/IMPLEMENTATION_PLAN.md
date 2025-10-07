# Tree System Refactoring - Implementation Plan

## Executive Summary

This document outlines the complete refactoring of the tree system from a plain object-based architecture to a class-based architecture. The refactoring maintains all existing features while providing better encapsulation, type safety, and extensibility.

## Architecture Overview

### Design Principles

1. **Separation of Concerns**: Each class has a single, well-defined responsibility
2. **Encapsulation**: Internal state and operations are properly encapsulated
3. **Immutability**: Where appropriate, expose immutable views of internal state
4. **Type Safety**: Leverage TypeScript's type system for compile-time guarantees
5. **Extensibility**: Design for future features (dynamic add/remove nodes)

### Class Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      TreeProvider                            │
│  (React Context - Manages tree instances and state)         │
└────────────────┬────────────────────────────┬────────────────┘
                 │                            │
        ┌────────▼─────────┐        ┌────────▼─────────┐
        │   TreeState      │        │   TreeGrid       │
        │  (State Mgmt)    │        │  (Rendering)     │
        └────────┬─────────┘        └────────┬─────────┘
                 │                            │
        ┌────────▼────────────────────────────▼─────────┐
        │              TreeNode[]                        │
        │         (Core tree structure)                  │
        └────────────────────────────────────────────────┘
```

## Implementation Details

### 1. TreeNode Class (`TreeNode.class.ts`)

**Purpose**: Core tree structure with parent/child relationships and navigation methods.

**Key Features**:

- Parent/child relationships (bidirectional)
- Metadata separated from structure
- Navigation methods (find, path, depth)
- Manipulation methods (add/remove children/siblings)
- Anti-selection logic
- Serialization/deserialization

**Properties**:

```typescript
class TreeNode {
  readonly key: string            // Unique identifier
  readonly title: string           // Display name
  readonly metadata: {...}         // Visual/config properties
  private _children: TreeNode[]    // Child nodes
  private _parent: TreeNode | null // Parent node
}
```

**Key Methods**:

- `getDepth()`: Calculate subtree depth
- `getPath()`: Get path from root to this node
- `findNode(key)`: Find node by key in subtree
- `addChild(node)`: Add a child node
- `removeChild(key)`: Remove a child node
- `getAntiKeysWithDescendants()`: Get all anti keys including descendants

### 2. TreeState Class (`TreeState.class.ts`)

**Purpose**: Manages selection and expansion state for trees.

**Key Features**:

- Tracks expanded/collapsed nodes
- Tracks selected nodes
- Generates tag JSON from selections
- Handles toggle operations with anti-selection
- Manages input field data

**Properties**:

```typescript
class TreeState {
  private expandedKeys: Set<string>;
  private selectedNodes: Set<string>;
  private tags: Record<string, unknown>;
  private trees: TreeNode[];
}
```

**Key Methods**:

- `toggleNode(key, isBranch, hasAnti)`: Toggle node with anti-selection
- `saveInputField(key, values)`: Save input field data
- `getState()`: Get current state snapshot
- `updateState(newState)`: Update state from partial

### 3. TreeGrid Class (`TreeGrid.class.ts`)

**Purpose**: Handles grid positioning and flattening for rendering.

**Key Features**:

- Computes maximum depth for grid columns
- Flattens tree into 2D grid structure
- Respects expanded/collapsed state
- Handles input field positioning

**Properties**:

```typescript
class TreeGrid {
  private trees: TreeNode[];
  private maxDepth: number;
}
```

**Key Methods**:

- `getMaxDepth()`: Get number of columns needed
- `toGrid(expanded, selected)`: Flatten to 2D grid
- `getNodePosition(key, expanded, selected)`: Get row/col for node

### 4. Updated Context (`TreeContext.new.tsx`)

**Changes**:

- Uses `TreeNode[]` instead of plain objects
- Uses `TreeState` for state management
- Uses `TreeGrid` for rendering
- Simplified hook APIs
- Better type safety

**New Hooks**:

- `useTreeStateValue()`: Get current state
- `useTreeManagers()`: Get trees, treeState, treeGrid
- `useTreeActions()`: Get action functions

### 5. Updated Tree Component (`tree.new.tsx`)

**Changes**:

- Uses `TreeGrid.toGrid()` for rendering
- Uses new context hooks
- Cleaner, more focused implementation

### 6. Updated Strategy Factory (`idea.constants.new.ts`)

**Changes**:

- Returns `TreeNode[]` (class instances)
- Uses `metadata` for all visual properties
- Compatible with `TreeNodeConfig` type
- Works with `createTimeframeNodes()` helper

## Migration Strategy

### Phase 1: Create New Classes (✅ Complete)

- [x] Create `TreeNode.class.ts`
- [x] Create `TreeGrid.class.ts`
- [x] Create `TreeState.class.ts`
- [x] Create `tree.utils.new.ts` with helpers

### Phase 2: Update Context and Components (✅ Complete)

- [x] Create `TreeContext.new.tsx`
- [x] Create `tree.new.tsx`
- [x] Create updated strategy factory

### Phase 3: Update tree.constants.ts

Next step is to update `tree.constants.ts` to return `TreeNodeConfig` objects instead of plain objects. This will require:

1. Update all helper functions to return `TreeNodeConfig`
2. Ensure `metadata` property is used for all visual properties
3. Update type definitions

### Phase 4: Testing (Next)

1. Unit tests for TreeNode class
2. Unit tests for TreeState class
3. Unit tests for TreeGrid class
4. Integration tests for full tree system
5. Visual regression tests

### Phase 5: Full Migration (Next)

1. Update all imports in application
2. Update all strategy factories
3. Test all features thoroughly
4. Remove old files
5. Remove `.new` suffixes

## Features Maintained

✅ **Visual**

- ToggleBadge styling
- Grid layout (left to right)
- Icons and images
- Descriptions and tooltips

✅ **Functionality**

- Node expansion/collapse
- Node selection
- Anti-selection logic
- Input fields for leaf nodes
- Tag JSON generation
- State persistence

✅ **Type Safety**

- Full TypeScript support
- Generic strategy factory types
- Compile-time checks

## Future Features (Ready to Implement)

### 1. Dynamic Node Management

```typescript
// Add node at runtime
const newNode = new TreeNode({
  key: "runtime-node",
  title: "Dynamic Node",
});
parentNode.addChild(newNode);

// Remove node at runtime
parentNode.removeChild("old-node-key");

// Reorder nodes
node.removeSibling("sibling-key");
node.addSibling(movedNode, "after");
```

### 2. Tree Persistence

```typescript
// Serialize entire tree
const treeJson = node.toJSON();
localStorage.setItem("tree", JSON.stringify(treeJson));

// Restore tree
const restored = TreeNode.fromJSON(JSON.parse(treeJson));
```

### 3. Advanced Queries

```typescript
// Find all nodes matching criteria
const filtered = tree
  .getAllDescendants()
  .filter((node) => node.metadata.icon === Clock);

// Get ancestors
let ancestors = [];
let current = node.parent;
while (current) {
  ancestors.push(current);
  current = current.parent;
}
```

### 4. Tree Validation

```typescript
// Validate tree structure
function validateTree(root: TreeNode): ValidationResult {
  // Check for circular references
  // Check for duplicate keys
  // Check for orphaned nodes
  // etc.
}
```

### 5. Performance Optimizations

```typescript
// Memoize grid computation
class TreeGrid {
  private gridCache = new Map();

  toGrid(expanded, selected) {
    const cacheKey = this.getCacheKey(expanded, selected);
    if (this.gridCache.has(cacheKey)) {
      return this.gridCache.get(cacheKey);
    }
    // ... compute and cache
  }
}
```

## Performance Considerations

### Current Implementation

1. **Grid Computation**: `O(n)` where n = number of visible nodes
2. **Node Lookup**: `O(n)` worst case (tree traversal)
3. **State Updates**: `O(n)` for anti-selection cascades

### Potential Optimizations

1. **Add Key Index**: `Map<string, TreeNode>` for O(1) lookups
2. **Cache Grid**: Memoize grid computation between renders
3. **Virtual Scrolling**: For large trees (>1000 nodes)
4. **Lazy Loading**: Load subtrees on demand

## Code Quality

### Type Safety Checklist

- [x] All class properties have explicit types
- [x] All method parameters have explicit types
- [x] All return types are explicit
- [x] Generic types are properly constrained
- [x] No `any` types (except for specific use cases)

### Documentation Checklist

- [x] JSDoc comments for all classes
- [x] JSDoc comments for all public methods
- [x] Clear parameter descriptions
- [x] Usage examples in comments
- [x] Migration guide
- [x] Implementation plan

### Testing Requirements

- [ ] Unit tests for TreeNode class
- [ ] Unit tests for TreeState class
- [ ] Unit tests for TreeGrid class
- [ ] Integration tests for context
- [ ] Visual regression tests for Tree component
- [ ] Performance benchmarks

## Rollback Plan

If issues arise during migration:

1. **Old files are preserved** - Can revert imports immediately
2. **Gradual migration** - Can migrate one feature/route at a time
3. **Feature flags** - Can toggle between old/new implementations
4. **Comprehensive tests** - Catch issues before production

## Success Criteria

- [ ] All existing features work identically
- [ ] No performance regression
- [ ] All tests pass
- [ ] TypeScript compilation with no errors
- [ ] No console errors/warnings
- [ ] Visual appearance unchanged
- [ ] Code coverage >= 80%

## Timeline Estimate

- ✅ **Phase 1**: Core classes - 4 hours (Complete)
- ✅ **Phase 2**: Context and components - 3 hours (Complete)
- ⏳ **Phase 3**: Update tree.constants.ts - 2 hours
- ⏳ **Phase 4**: Testing - 4 hours
- ⏳ **Phase 5**: Full migration - 2 hours
- ⏳ **Phase 6**: Documentation and cleanup - 1 hour

**Total**: ~16 hours

## Next Steps

1. ✅ Review this implementation plan
2. ⏳ Update `tree.constants.ts` to use `TreeNodeConfig`
3. ⏳ Write unit tests for core classes
4. ⏳ Test in development environment
5. ⏳ Gradual migration route by route
6. ⏳ Remove old files once stable

## Questions & Decisions

### Resolved

- ✅ Use classes instead of interfaces
- ✅ Separate metadata from structure
- ✅ Keep existing features unchanged
- ✅ Maintain backward compatibility during migration

### Open Questions

- [ ] Should we add caching to TreeGrid?
- [ ] Should we add key index to TreeNode for faster lookups?
- [ ] Should we implement undo/redo for tree operations?
- [ ] Should we add tree diffing for optimization?
