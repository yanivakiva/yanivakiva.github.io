import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p>Designed & built by Yaniv Akiva</p>
        <p>&copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
