import { motion, AnimatePresence } from 'framer-motion';
import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';


const AnimatedOutlet = ({ children }: PropsWithChildren) => {
  const location = useLocation();

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

      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedOutlet;
