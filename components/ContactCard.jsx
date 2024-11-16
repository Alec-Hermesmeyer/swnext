"use client";
import Link from "next/link";
import styles from "@/styles/Blog.module.css";
import { Lato } from "next/font/google";
import { useRouter } from 'next/router';

const lato = Lato({
  weight: ["900", "100", "300", "400", "700"],
  subsets: ["latin"],
});

const ContactCard = () => {
  const router = useRouter();

  const navigateToContact = () => {
    router.push('/contact');
  };

  const navigateToCareers = () => {
    router.push('/careers');
  };

  return (
    <div className={styles.introLeftContact}>
      <div className={styles.rightCard}>
        <div className={styles.cardWrapper}>
          <div className={styles.cardContent}>
            <h3 className={lato.className}> We Provide Nation-Wide Service</h3>
            <ul>
              <li className={lato.className}>
                <Link href="tel:+2147030484">Call: (214)-703-0484</Link>
              </li>
              <li>Address: 2806 Singleton St. Rowlett, TX 75088</li>
            </ul>
            <span>
              {/* <button className={lato.className} onClick={navigateToContact}>
                Contact Us
              </button>
              <button className={lato.className} onClick={navigateToCareers}>
                Careers
              </button> */}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactCard;
