import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ve Anon Key tanımlanmamış! .env dosyasını kontrol edin.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Initialize database tables
export const initDatabase = async () => {
  try {
    // Create subscription plans if they don't exist
    const { data: existingPlans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id')
      .limit(1);

    if (!existingPlans?.length) {
      const defaultPlans = [
        {
          name: 'Free',
          price: 0,
          address_limit: 5,
          features: ['5 locations', 'Basic analytics', 'Email support'],
          is_popular: false
        },
        {
          name: 'Premium',
          price: 29.99,
          address_limit: 50,
          features: [
            '50 locations',
            'Advanced analytics',
            'Priority support',
            'Real-time tracking',
            'Custom reports'
          ],
          is_popular: true
        },
        {
          name: 'Enterprise',
          price: 99.99,
          address_limit: -1,
          features: [
            'Unlimited locations',
            'Enterprise analytics',
            '24/7 Priority support',
            'Real-time tracking',
            'Custom reports',
            'API access',
            'Dedicated account manager'
          ],
          is_popular: false
        }
      ];

      for (const plan of defaultPlans) {
        const { error: insertError } = await supabase
          .from('subscription_plans')
          .insert([plan]);

        if (insertError) {
          console.error(`Error creating ${plan.name} plan:`, insertError);
        }
      }
    }

    // Initialize real-time subscriptions
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public'
        },
        (payload) => {
          console.log('Change received!', payload);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};