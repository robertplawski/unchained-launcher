import { motion, AnimatePresence } from 'framer-motion';
import type { PropsWithChildren } from 'react';
import { useLocation, useNavigation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const AnimatedOutlet = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const navigation = useNavigation();
  const [prevChildren, setPrevChildren] = useState<React.ReactNode>(children);
  const currentChildrenRef = useRef(children);

  // Update ref with current children
  currentChildrenRef.current = children;

  // Store previous children during navigation
  useEffect(() => {
    if (navigation.state === 'loading') {
      // Keep previous children visible during navigation
      setPrevChildren(currentChildrenRef.current);
    } else {
      // Update to new children after navigation
      setPrevChildren(children);
    }
  }, [children, navigation.state]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1]
        }}
        style={{
          minHeight: '100vh', // Prevent layout shift
          position: 'relative'
        }}
      >
        {navigation.state === 'loading' ? prevChildren : children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedOutlet;
