import {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  type ForwardedRef,
  useCallback
} from "react";
import { useRovingFocus } from "react-roving-focus";

// Define the type for the ref object you want to expose
export interface FocusableItemHandle {
  focus: () => void;
  isFocused: boolean; // Expose an object with a 'current' property holding the boolean
}

export interface FocusableItemProps {
  className?: string;
  focus?: boolean;
  onClick?: () => void;
  onSelect?: () => void;
  children?: React.ReactNode;
}

// Use forwardRef to accept an external ref
const FocusableItem = forwardRef<FocusableItemHandle, FocusableItemProps>(
  function FocusableItem({ children, onClick, onSelect, className, focus }, ref: ForwardedRef<FocusableItemHandle>) {
    const { ref: rovingFocusRef, tabIndex } = useRovingFocus<HTMLButtonElement>();
    const [isFocusedState, setIsFocusedState] = useState(false); // State to track focus internally

    // Memoize the focus handler
    const handleFocus = useCallback(() => {
      console.log("Focus gained by FocusableItem");
      setIsFocusedState(true); // Update internal state
      if (onSelect) {

        onSelect()
      }
      if (rovingFocusRef.current) {
        rovingFocusRef.current.classList.add('focusable-item-focused'); // Add CSS class
        rovingFocusRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, [rovingFocusRef]);

    // Memoize the blur handler
    const handleBlur = useCallback(() => {
      console.log("Focus lost from FocusableItem");
      setIsFocusedState(false); // Update internal state
      if (rovingFocusRef.current) {
        rovingFocusRef.current.classList.remove('focusable-item-focused'); // Remove CSS class
      }
    }, [rovingFocusRef]);

    // Memoize the focus effect
    useEffect(() => {
      if (!focus || !rovingFocusRef.current) {
        return;
      }
      rovingFocusRef.current.focus();
    }, [focus, rovingFocusRef]);


    // Memoize the event listener setup effect
    useEffect(() => {
      const element = rovingFocusRef.current;

      if (element) {
        // Add event listeners using the memoized callbacks
        element.addEventListener('focus', handleFocus);
        element.addEventListener('blur', handleBlur);

        // Initial check: if element is focused when effect runs
        if (element === document.activeElement) {
          handleFocus();
        }

        // Cleanup: Remove event listeners using the same memoized callbacks
        return () => {
          element.removeEventListener('focus', handleFocus);
          element.removeEventListener('blur', handleBlur);
        };
      }

      return undefined;
    }, [rovingFocusRef, handleFocus, handleBlur]); // Depend on the memoized callbacks

    const pleaseFocus = () => {
      const element = rovingFocusRef.current;
      element.focus();

    }

    // Expose an object containing the focus state variable to the parent component via the ref
    // Note: This object reference changes every time isFocusedState changes
    useImperativeHandle(ref, () => ({
      focus: pleaseFocus,
      isFocused: isFocusedState
    }), [isFocusedState]); // Depend on the state variable

    // Construct the final className string
    const finalClassName = `${className || ""} ${isFocusedState ? 'focusable-item-focused' : ''}`.trim();

    return (
      <button onClick={onClick} ref={rovingFocusRef} tabIndex={tabIndex} className={finalClassName}>
        {children}
      </button>
    );
  }
);

export default FocusableItem;
