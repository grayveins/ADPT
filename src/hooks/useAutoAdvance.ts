/**
 * useAutoAdvance Hook
 * Provides auto-advance functionality for single-select onboarding screens
 * - Haptic feedback on selection
 * - 350ms delay before advancing
 * - Visual feedback during delay
 */

import { useCallback, useState, useRef } from "react";
import { hapticPress } from "@/src/animations/feedback/haptics";

type AutoAdvanceOptions = {
  delay?: number; // Default 350ms
  onSelect?: (value: string) => void; // Called immediately on selection
  onAdvance?: () => void; // Called after delay
};

export function useAutoAdvance(options: AutoAdvanceOptions = {}) {
  const { delay = 350, onSelect, onAdvance } = options;
  
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const select = useCallback(
    (value: string) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Haptic feedback
      hapticPress();

      // Set selected value
      setSelectedValue(value);
      setIsAdvancing(true);

      // Call onSelect immediately
      if (onSelect) {
        onSelect(value);
      }

      // Schedule advance after delay
      timeoutRef.current = setTimeout(() => {
        setIsAdvancing(false);
        if (onAdvance) {
          onAdvance();
        }
      }, delay);
    },
    [delay, onSelect, onAdvance]
  );

  // Cancel pending advance (useful if user navigates back)
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsAdvancing(false);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    cancel();
    setSelectedValue(null);
  }, [cancel]);

  return {
    selectedValue,
    isAdvancing,
    select,
    cancel,
    reset,
    isSelected: (value: string) => selectedValue === value,
  };
}

export default useAutoAdvance;
