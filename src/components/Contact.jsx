import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Mail, Github, Linkedin } from 'lucide-react';
import BlurText from './ui/BlurText';
import styles from './Contact.module.css';

const socials = [
  { icon: Github, href: 'https://github.com/yanivakiva', label: 'GitHub' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/yanivakiva', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:contact@yanivakiva.com', label: 'Email' },
];

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="contact" className={styles.contact} ref={ref}>
      <BlurText text="Let's connect" delay={50} as="h2" className={styles.title} />

      <motion.p
        className={styles.description}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Whether you have a question, want to collaborate, or just want to say hi
        — my inbox is always open.
      </motion.p>

      <motion.a
        href="mailto:contact@yanivakiva.com"
        className={styles.cta}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.5 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <Mail size={18} />
        Say Hello
      </motion.a>

      <motion.div
        className={styles.socials}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target={s.href.startsWith('mailto') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label={s.label}
          >
            <s.icon size={22} />
          </a>
        ))}
      </motion.div>
    </section>
  );
}
