
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const COOKIE_NAME = 'sw-admin-auth';

const createSupabaseClient = () => {
    if (typeof window === 'undefined') {
        return createClient(SUPABASE_URL, SUPABASE_KEY, {
            realtime: { enabled: true },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        });
    }

    return createBrowserClient(SUPABASE_URL, SUPABASE_KEY, {
        realtime: { enabled: true },
        cookieOptions: { name: COOKIE_NAME },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
};

const supabase = createSupabaseClient();

export default supabase;
