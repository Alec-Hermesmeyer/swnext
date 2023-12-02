'use client'

import { createContext, useContext } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const FadeInStaggerContext = createContext(false)

// const viewport = { once: true, margin: '0px 0px -200px' }

export function FadeIn(props) {
  let shouldReduceMotion = useReducedMotion()
  let isInStaggerGroup = useContext(FadeInStaggerContext)
  const variants = {
    hidden: { opacity: 0, x: -50 }, // Start from left and invisible
    visible: { opacity: 1, x: 0 },  // End at the original position and fully visible
  };

  return (
    <motion.div style={{ display: 'flex' , width: '92vw'}} 
      initial="hidden"     // Initial state
      animate="visible"    // Animate to the visible state
      variants={variants}  // Use the defined variants
      transition={{ duration: 0.5 }}
    //   {...(isInStaggerGroup
    //     ? {}
    //     : {
    //         initial: 'hidden',
    //         whileInView: 'visible',
    //         viewport,
    //       })}
      {...props}
    />
  );
}

//   return (
//     <motion.div
//       variants={{
//         hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
//         visible: { opacity: 1, y: 0 },
//       }}
//       transition={{ duration: 0.5 }}
//       {...(isInStaggerGroup
//         ? {}
//         : {
//             initial: 'hidden',
//             whileInView: 'visible',
//             viewport,
//           })}
//       {...props}
//     />
//   )
// }

export function FadeInStagger({ faster = false, ...props }) {
  return (
    <FadeInStaggerContext.Provider value={true}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ staggerChildren: faster ? 0.12 : 0.2 }}
        {...props}
      />
    </FadeInStaggerContext.Provider>
  )
}