import { Doc } from "convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { useUpdateDrawing } from "./use-update-drawing";

export function useMoveImage(drawing?: Doc<"drawings">) {
  const { mutateAsync: updateImage } = useUpdateDrawing({});

  // Image positioning state - initialize from database
  const [imageOffsetY, setImageOffsetY] = useState<number>(
    drawing?.offsetY ?? 0
  );
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasUserDragged = useRef(false);

  // Sync with Convex realtime updates - only update if user hasn't manually dragged
  useEffect(() => {
    if (drawing?.offsetY !== undefined && !hasUserDragged.current) {
      setImageOffsetY(drawing.offsetY);
    }
  }, [drawing?.offsetY]);

  // Reset when drawing changes (new image uploaded)
  useEffect(() => {
    if (drawing?._id) {
      hasUserDragged.current = false;
      setImageOffsetY(drawing.offsetY ?? 0);
      setIsMoveMode(false);
    }
  }, [drawing?._id, drawing?.offsetY]);

  function handleMouseDown(e: React.MouseEvent) {
    if (!isMoveMode) return;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartOffset.current = imageOffsetY;
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !imageRef.current || !containerRef.current) return;

    // Mark that user has manually dragged
    hasUserDragged.current = true;

    const deltaY = e.clientY - dragStartY.current;
    const newOffset = dragStartOffset.current + deltaY;

    // Calculate bounds
    const imageHeight = imageRef.current.offsetHeight;
    const containerHeight = containerRef.current.offsetHeight;
    const maxOffset = 0; // Can't drag down beyond top
    const minOffset = -(imageHeight - containerHeight); // Can't drag up beyond bottom

    // Clamp the offset within bounds
    const clampedOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));
    setImageOffsetY(clampedOffset);
  }

  async function handleMouseUp() {
    setIsDragging(false);

    // Only save to database if drawing exists and user has dragged
    if (!drawing?._id || !hasUserDragged.current) return;

    // Save the current offset to the database
    await updateImage({ id: drawing._id, offsetY: imageOffsetY });
  }

  // Touch event handlers for mobile/tablet devices
  function handleTouchStart(e: React.TouchEvent) {
    if (!isMoveMode) return;
    // Prevent default to stop page scrolling when in move mode
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartOffset.current = imageOffsetY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging || !imageRef.current || !containerRef.current) return;

    // Prevent default to stop page scrolling
    e.preventDefault();

    // Mark that user has manually dragged
    hasUserDragged.current = true;

    const deltaY = e.touches[0].clientY - dragStartY.current;
    const newOffset = dragStartOffset.current + deltaY;

    // Calculate bounds
    const imageHeight = imageRef.current.offsetHeight;
    const containerHeight = containerRef.current.offsetHeight;
    const maxOffset = 0; // Can't drag down beyond top
    const minOffset = -(imageHeight - containerHeight); // Can't drag up beyond bottom

    // Clamp the offset within bounds
    const clampedOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));
    setImageOffsetY(clampedOffset);
  }

  async function handleTouchEnd() {
    setIsDragging(false);

    // Only save to database if drawing exists and user has dragged
    if (!drawing?._id || !hasUserDragged.current) return;

    // Save the current offset to the database
    await updateImage({ id: drawing._id, offsetY: imageOffsetY });
  }

  async function resetPosition() {
    hasUserDragged.current = false;
    setImageOffsetY(0);
    setIsMoveMode(false);

    // Save reset position to database if drawing exists
    if (drawing?._id) {
      await updateImage({ id: drawing._id, offsetY: 0 });
    }
  }

  function toggleMoveMode() {
    setIsMoveMode((prev) => !prev);
  }

  return {
    // State
    imageOffsetY,
    isMoveMode,
    isDragging,
    // Refs
    imageRef,
    containerRef,
    // Handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // Actions
    resetPosition,
    toggleMoveMode,
  };
}
