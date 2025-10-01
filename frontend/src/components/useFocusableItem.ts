import { useState, useEffect, useRef, useCallback } from 'react';

interface FocusableItemHandle {
  parent?: HTMLElement;
  // Add other properties as needed
}

export function useFocusableItem() {
  const focusableItemRef = useRef<FocusableItemHandle>(null);
  const [isFocused, setIsFocused] = useState(false);

  const updateFocusState = useCallback(() => {
    const hasFocus = focusableItemRef.current?.parent?.classList?.contains("focusable-item-focused") || false;
    setIsFocused(hasFocus);
  }, []);

  useEffect(() => {
    const focusableItem = focusableItemRef.current;

    if (focusableItem && focusableItem.parent) {
      // Initial check
      updateFocusState();

      // Set up mutation observer to watch for class changes
      const observer = new MutationObserver(updateFocusState);

      observer.observe(focusableItem.parent, {
        attributes: true,
        attributeFilter: ['class']
      });

      return () => {
        observer.disconnect();
      };
    }
  }, [updateFocusState]);

  const forceUpdateFocus = useCallback(() => {
    updateFocusState();
  }, [updateFocusState]);

  return {
    focusableItemRef,
    isFocused,
    forceUpdateFocus
  } as const;
}
