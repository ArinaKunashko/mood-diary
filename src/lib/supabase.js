import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ipernfhcinbcnoczczmk.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_DdM9Hsc3721vwsqpXFB7Jw_uwbUSrH8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
