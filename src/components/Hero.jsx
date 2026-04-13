import { lazy, Suspense, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mail, ArrowDown } from 'lucide-react';
import styles from './Hero.module.css';

const HeroScene = lazy(() => import('./three/HeroScene'));

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section id="home" ref={ref} className={styles.hero}>
      {/* Blackhole shader background */}
      <motion.div className={styles.canvas} style={{ opacity: sceneOpacity }}>
        <Suspense fallback={<div className={styles.fallback} />}>
          <HeroScene />
        </Suspense>
      </motion.div>

      <div className={styles.content}>
        <motion.p
          className={styles.greeting}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          hi, I'm
        </motion.p>

        <motion.h1
          className={styles.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          Yaniv Akiva
        </motion.h1>

        <motion.p
          className={styles.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          Senior Software Engineer
        </motion.p>

        <motion.p
          className={styles.description}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          I build distributed systems that process petabytes of security data.
          <br />
          Bridging human expertise and machine intelligence.
        </motion.p>

        <motion.a
          href="mailto:contact@yanivakiva.com"
          className={styles.cta}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Mail size={16} />
          Get in touch
        </motion.a>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        <ArrowDown size={16} />
      </motion.div>
    </section>
  );
}
