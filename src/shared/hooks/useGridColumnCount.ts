import { useCallback, useLayoutEffect, useState } from "react";

const GRID_GAP_PX = 12;
const GRID_MIN_ITEM_WIDTH_PX = 88;

function getColumnCount(width: number) {
  return Math.max(
    1,
    Math.floor((width + GRID_GAP_PX) / (GRID_MIN_ITEM_WIDTH_PX + GRID_GAP_PX)),
  );
}

export function useGridColumnCount() {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [columnCount, setColumnCount] = useState(1);

  const gridRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useLayoutEffect(() => {
    if (!element) {
      return;
    }

    const measure = () => {
      setColumnCount(getColumnCount(element.clientWidth));
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element]);

  return {
    columnCount,
    gridRef,
  };
}
