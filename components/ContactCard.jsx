import Link from "next/link";
import styles from "@/styles/Blog.module.css";
import { Lato } from "next/font/google";

const lato = Lato({
  weight: ["900", "100", "300", "400", "700"],
  subsets: ["latin"],
});
const ContactCard = () => {
  return (
    <div className={styles.introLeftContact}>
      <div className={styles.rightCard}>
        <div className={styles.cardWrapper}>
          <div className={styles.cardContent}>
            <h3 className={lato.className}> We Provide Nation-Wide Service</h3>
            <ul>
              <Link href="tel: +2147030484">
                <li className={lato.className}>Call: (214)-703-0484</li>
              </Link>
              <li>Address: 2806 Singleton St. Rowlett, TX 75088</li>
            </ul>
            <span>
              <Link href="/contact">
                <button className={lato.className}>Contact Us</button>
              </Link>
              <Link href="/careers">
                <button className={lato.className}>Careers</button>
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ContactCard;
