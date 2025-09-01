"use client";
import Link from "next/link";
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-center">
          <div className="space-y-4">
            <h3 className={`${lato.className} text-xl font-semibold text-gray-900`}>We Provide Nation-Wide Service</h3>
            <ul className="space-y-2 text-gray-700">
              <li className={lato.className}>
                <Link href="tel:+2147030484" className="text-blue-600 hover:text-blue-800">Call: (214)-703-0484</Link>
              </li>
              <li>Address: 2806 Singleton St. Rowlett, TX 75088</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactCard;
