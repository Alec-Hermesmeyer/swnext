import { useAuth } from '@/context/AuthContext';
import styles from '../styles/AdminLayout.module.css';
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });
function Logout() {
  const { logout } = useAuth();
  return (
    <button className={styles.logoutBtn} onClick={logout}>
      <p className={lato.className}>Logout</p>
    </button>
  );
}
export default Logout;