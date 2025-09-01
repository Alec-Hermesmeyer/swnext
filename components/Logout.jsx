import { useAuth } from '@/context/AuthContext';
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });
function Logout() {
  const { logout } = useAuth();
  return (
    <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium" onClick={logout}>
      <p className={lato.className}>Logout</p>
    </button>
  );
}
export default Logout;