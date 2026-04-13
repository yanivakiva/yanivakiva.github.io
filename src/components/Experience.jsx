import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Section from './Section';
import BlurText from './ui/BlurText';
import styles from './Experience.module.css';

const experiences = [
  {
    company: 'Sygnia',
    title: 'Senior Backend Engineer',
    duration: 'Dec 2022 - Present',
    url: 'https://www.sygnia.co/',
    desc: [
      'Architected distributed backend systems processing 3+ PB/month of security telemetry across Kubernetes-based production environments',
      'Built and scaled FastAPI-based microservices on Kubernetes for mission-critical security workloads, enabling horizontal scale under high-volume traffic',
      'Developed high-performance EDR agents in Rust, collecting low-level OS telemetry and integrating with centralized detection pipelines',
      'Implemented end-to-end observability with Datadog (metrics, logs, tracing, alerts), improving production reliability and shortening incident resolution cycles',
      'Built CI/CD pipelines with Azure DevOps and ArgoCD to automate deployment and rollout workflows across Kubernetes environments',
    ],
  },
  {
    company: 'DOKKA',
    title: 'Backend Engineer',
    duration: 'Nov 2020 - Oct 2022',
    url: 'https://www.dokka.com/',
    desc: [
      'Built a RabbitMQ-based asynchronous processing framework that improved throughput by ~30% and enabled scalable background task execution',
      'Developed a document-processing framework for key-phrase extraction, table parsing, document matching, and asynchronous batch analysis',
      'Built backend services and middleware in Python, Flask, and SQLAlchemy to support scalable document-processing workflows',
      'Integrated the platform with SAP ERP systems, expanding enterprise compatibility and supporting customer onboarding',
    ],
  },
  {
    company: 'IDF Intelligence',
    title: 'Backend Engineer',
    duration: 'Feb 2018 - Nov 2020',
    url: null,
    desc: [
      'Designed and implemented distributed data-processing systems for intelligence workloads, handling large-scale relational and non-relational datasets',
      'Built Python/Flask/SQLAlchemy microservices deployed to Kubernetes with automated CI/CD pipelines',
      'Partnered with research and operational stakeholders to translate complex requirements into scalable backend systems',
    ],
  },
];

const contentVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemFade = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Experience() {
  const [activeTab, setActiveTab] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <Section id="experience">
      <BlurText text="/experience" delay={40} as="h2" className={styles.sectionTitle} />

      <div className={styles.container} ref={ref}>
        <div className={styles.tabs}>
          {experiences.map((exp, i) => (
            <button
              key={exp.company}
              className={`${styles.tab} ${activeTab === i ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {exp.company}
            </button>
          ))}
          <motion.div
            className={styles.indicator}
            animate={{ y: activeTab * 48 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className={styles.panel}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            <h3 className={styles.jobTitle}>
              {experiences[activeTab].title}
              {' @ '}
              {experiences[activeTab].url ? (
                <a href={experiences[activeTab].url} target="_blank" rel="noopener noreferrer">
                  {experiences[activeTab].company}
                </a>
              ) : (
                <span className={styles.companyName}>{experiences[activeTab].company}</span>
              )}
            </h3>
            <p className={styles.duration}>{experiences[activeTab].duration}</p>

            <motion.ul
              className={styles.descList}
              variants={stagger}
              initial="hidden"
              animate={isInView ? 'show' : 'hidden'}
            >
              {experiences[activeTab].desc.map((item, i) => (
                <motion.li key={i} variants={itemFade} className={styles.descItem}>
                  <span className={styles.bullet}>&#9655;</span>
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
