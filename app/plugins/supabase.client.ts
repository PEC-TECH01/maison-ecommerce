import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const supabaseUrl = String(config.public.supabaseUrl || '').trim()
  const supabaseKey = String(config.public.supabaseKey || '').trim()

  console.log('Supabase URL loaded:', Boolean(supabaseUrl))
  console.log('Supabase key loaded:', Boolean(supabaseKey))

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase configuration missing. Check your root .env file.'
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  return {
    provide: {
      supabase,
    },
  }
})