// services/supabaseClient.ts
// Standard React Native setup for supabase-js: AsyncStorage keeps the
// session across app restarts, and the URL polyfill is required since
// Hermes (RN's JS engine) doesn't fully implement the URL API that
// supabase-js relies on.

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config/supabaseConfig';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
