import { Link } from "@tanstack/react-router";
import styles from "./NotFound.module.css";

export function NotFound({ children }: { children?: any }) {
  return (
    <div className={styles.container}>
      <div className={styles.message}>
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className={styles.actions}>
        <button
          onClick={() => window.history.back()}
          className={`${styles.actionButton} ${styles.goBackButton}`}
        >
          Go back
        </button>
        <Link to="/" className={`${styles.actionButton} ${styles.startOverButton}`}>
          Start Over
        </Link>
      </p>
    </div>
  );
}
