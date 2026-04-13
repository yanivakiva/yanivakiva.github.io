import { lazy, Suspense, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mail } from 'lucide-react';
import BlurText from './ui/BlurText';
import styles from './Hero.module.css';

const HeroScene = lazy(() => import('./three/HeroScene'));

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.2, delayChildren: 0.8 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scrollProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="home" ref={ref} className={styles.hero}>
      <motion.div className={styles.canvas} style={{ opacity: sceneOpacity }}>
        <Suspense fallback={<div className={styles.fallback} />}>
          <HeroScene scrollProgress={scrollProgress.get()} />
        </Suspense>
      </motion.div>

      <div className={styles.content}>
        <BlurText
          text="Yaniv Akiva"
          delay={60}
          as="h1"
          className={styles.name}
        />

        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className={styles.title}>
            Senior Software Engineer
          </motion.p>

          <motion.p variants={fadeUp} className={styles.description}>
            Building distributed systems that process petabytes.
            <br />
            Bridging human expertise and machine intelligence.
          </motion.p>

          <motion.a
            variants={fadeUp}
            href="mailto:contact@yanivakiva.com"
            className={styles.cta}
          >
            <Mail size={18} />
            Get in touch
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
