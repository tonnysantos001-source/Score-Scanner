'use client';

import { motion } from 'framer-motion';

/**
 * AuroraBackground — fixed animated background layer.
 * Place as the FIRST child inside any page's outermost div.
 * The parent div must have a transparent or no background.
 */
export default function AuroraBackground() {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: -10,
            overflow: 'hidden', background: '#070711',
            pointerEvents: 'none',
        }}>
            {/* Dot grid */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }} />

            {/* ORB 1 — Blue, top-left */}
            <motion.div
                animate={{ x: [0, 80, -50, 60, 0], y: [0, -60, 80, -30, 0], scale: [1, 1.15, 0.9, 1.08, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', top: '-10%', left: '-5%',
                    width: '700px', height: '700px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(59,130,246,0.20) 35%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />

            {/* ORB 2 — Purple, mid-right */}
            <motion.div
                animate={{ x: [0, -90, 50, -60, 0], y: [0, 70, -50, 40, 0], scale: [1.05, 0.9, 1.2, 0.95, 1.05] }}
                transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', top: '5%', right: '-10%',
                    width: '650px', height: '650px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.50) 0%, rgba(139,92,246,0.15) 38%, transparent 70%)',
                    filter: 'blur(35px)',
                }}
            />

            {/* ORB 3 — Indigo, center-lower */}
            <motion.div
                animate={{ x: [0, 70, -30, 50, 0], y: [0, 50, -70, 30, 0], scale: [0.95, 1.1, 0.88, 1.05, 0.95] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', bottom: '5%', left: '25%',
                    width: '600px', height: '600px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0.12) 40%, transparent 70%)',
                    filter: 'blur(38px)',
                }}
            />

            {/* ORB 4 — Cyan, bottom-right */}
            <motion.div
                animate={{ x: [0, -60, 40, -80, 0], y: [0, -40, 60, -50, 0], scale: [1, 1.12, 0.92, 1.06, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', bottom: '-5%', right: '5%',
                    width: '500px', height: '500px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(6,182,212,0.38) 0%, rgba(6,182,212,0.10) 42%, transparent 70%)',
                    filter: 'blur(30px)',
                }}
            />
        </div>
    );
}
