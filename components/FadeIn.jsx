'use client'

import { createContext, useContext } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const FadeInStaggerContext = createContext(false)

const viewport = { once: true, margin: '0px 0px -200px' }

export function FadeIn(props) {
    let shouldReduceMotion = useReducedMotion()
    let isInStaggerGroup = useContext(FadeInStaggerContext)

    return (
        <motion.div
            style={{
                display: 'flex',
                width: '97.5vw',
                paddingTop: '20px',
                marginBottom: '60px',
                flexDirection: 'row', // Add this line to display horizontally
            }}
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0, x: shouldReduceMotion ? 0 : 24 },
                visible: { opacity: 1, x: 0 },
            }}
            transition={{ duration: 0.5 }}
            {...(isInStaggerGroup ? {} : { initial: 'hidden', whileInView: 'visible', viewport })}
            {...props}
        />
    )
}

export function FadeOut(props) {
    const variants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
    }

    return (
        <motion.div
            style={{
                display: 'flex',
                width: '97.5vw',
                marginTop: '60px',
                flexDirection: 'row', // Add this line to display horizontally
            }}
            initial="hidden"
            animate="visible"
            variants={variants}
            transition={{ duration: 1.5 }}
            {...props}
        />
    )
}

export function FadeInStagger({ faster = false, ...props }) {
    return (
        <FadeInStaggerContext.Provider value={true}>
            <motion.div
                initial="hidden"
                whileInView="visible"
                exit="hidden"
                viewport={viewport}
                transition={{ staggerChildren: faster ? 0.12 : 0.2 }}
                {...props}
            />
        </FadeInStaggerContext.Provider>
    )
}