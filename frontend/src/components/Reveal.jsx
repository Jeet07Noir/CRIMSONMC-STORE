import { motion } from "framer-motion";

// Reusable scroll-triggered fade-up reveal.
export const Reveal = ({ children, delay = 0, y = 26, className, id, ...rest }) => (
  <motion.div
    id={id}
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    {...rest}
  >
    {children}
  </motion.div>
);

export default Reveal;
