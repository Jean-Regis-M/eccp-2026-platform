import { motion } from 'motion/react';

export default function StaggeredParent({ children }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.05 }
        }
      }}
      className="space-y-3"
    >
      {children.map((child, idx) => (
        <motion.div
          key={idx}
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}