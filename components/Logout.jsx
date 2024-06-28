import { useAuth } from '@/context/AuthContext';
import styles from '../styles/AdminLayout.module.css';

function Logout() {
  const { logout } = useAuth();
  return (
    <button className={styles.logoutBtn} onClick={logout}>
      Logout
    </button>
  );
}
export default Logout;