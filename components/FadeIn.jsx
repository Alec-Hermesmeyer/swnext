'use client'

import { createContext, useContext } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const FadeInStaggerContext = createContext(false)

// const viewport = { once: true, margin: '0px 0px -200px' }

export function FadeIn(props) {
  const variants = {
    hidden: { opacity: 0, x: -50 }, // Start from left and invisible
    visible: { opacity: 1, x: 0 },  // End at the original position and fully visible
  };

  return (
    <motion.div style={{ display: 'flex' , width: '98vw', paddingTop: '20px'}} 
      initial="hidden"     // Initial state
      animate="visible"    // Animate to the visible state
      variants={variants}  // Use the defined variants
      transition={{ duration: 1.5 }} // Smooth transition
      {...props}
    />
  );
}

export function FadeOut(props) {
    const variants = {
        hidden: { opacity: 0, x: 50 }, // Start from left and invisible
        visible: { opacity: 1, x: 0 },  // End at the original position and fully visible
    };
    
    return (
        <motion.div style={{ display: 'flex' , width: '98vw',  paddingTop: '40px'}} 
        initial="hidden"     // Initial state
        animate="visible"    // Animate to the visible state
        variants={variants}  // Use the defined variants
        transition={{ duration: 1.5 }} // Smooth transition
        {...props}
        />
    );
    }


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