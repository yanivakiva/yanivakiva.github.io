import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Section from './Section';
import BlurText from './ui/BlurText';
import styles from './About.module.css';

const techStack = [
  ['Python', 'Rust', 'SQL', 'FastAPI'],
  ['Kubernetes', 'Docker', 'Kafka', 'Redis'],
  ['Postgres', 'Snowflake', 'Datadog', 'ArgoCD'],
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemFade = {
  hidden: { opacity: 0, x: -15 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <Section id="about">
      <BlurText text="/about" delay={40} as="h2" className={styles.sectionTitle} />

      <div className={styles.content} ref={ref}>
        <div className={styles.description}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            I'm a Senior Software Engineer specializing in distributed backend
            systems and security infrastructure. At{' '}
            <a href="https://www.sygnia.co/" target="_blank" rel="noopener noreferrer">
              Sygnia
            </a>
            , I architect and operate systems processing over{' '}
            <strong>3 petabytes of security telemetry monthly</strong> across
            Kubernetes-based production environments.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            My work spans high-performance backend services, EDR agent development
            in Rust, and large-scale data pipeline engineering. I also bring
            independent hands-on experience in{' '}
            <strong>AI security architecture</strong>, LLM/agent traffic control,
            and provider integration patterns.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={styles.techIntro}
          >
            Technologies I work with:
          </motion.p>

          <motion.div
            className={styles.techGrid}
            variants={stagger}
            initial="hidden"
            animate={isInView ? 'show' : 'hidden'}
          >
            {techStack.flat().map((tech) => (
              <motion.div key={tech} variants={itemFade} className={styles.techItem}>
                <span className={styles.techArrow}>&#9655;</span>
                {tech}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className={styles.imageWrapper}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <img
            src="/me.jpg"
            alt="Yaniv Akiva"
            className={styles.photo}
            loading="lazy"
          />
        </motion.div>
      </div>
    </Section>
  );
}
