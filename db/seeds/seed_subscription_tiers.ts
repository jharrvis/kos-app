import { createClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/types/subscription'

const DEFAULT_TIERS: Omit<SubscriptionTier, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'free',
    display_name: 'Free',
    description: 'Paket gratis untuk memulai. Cocok untuk mencoba platform.',
    price: 0,
    billing_period: 'monthly',
    features: {
      max_properties: 1,
      max_images_per_property: 3,
      featured_listing: false,
      priority_support: false,
      analytics: false,
    },
    is_active: true,
  },
  {
    name: 'basic',
    display_name: 'Basic',
    description: 'Paket dasar untuk penyedia kos pemula. Maksimal 5 properti dengan listing unggulan.',
    price: 99000,
    billing_period: 'monthly',
    features: {
      max_properties: 5,
      max_images_per_property: 10,
      featured_listing: true,
      priority_support: false,
      analytics: true,
    },
    is_active: true,
  },
  {
    name: 'premium',
    display_name: 'Premium',
    description: 'Paket lengkap untuk penyedia kos profesional. Properti unlimited dengan dukungan prioritas.',
    price: 299000,
    billing_period: 'monthly',
    features: {
      max_properties: null,
      max_images_per_property: 50,
      featured_listing: true,
      priority_support: true,
      analytics: true,
    },
    is_active: true,
  },
]

async function main() {
  console.log('💳 Starting subscription tiers seed...\n')

  const supabase = await createClient()

  console.log('💾 Inserting subscription tiers into database...')
  const { data: insertedTiers, error } = await supabase
    .from('subscription_tiers')
    .upsert(DEFAULT_TIERS, { onConflict: 'name', ignoreDuplicates: false })
    .select()

  if (error) {
    console.error('❌ Error inserting subscription tiers:', error)
    process.exit(1)
  }

  console.log(`✅ Inserted ${insertedTiers?.length || 0} subscription tiers\n`)

  console.log('📊 Subscription Tiers Summary:')
  insertedTiers?.forEach(tier => {
    console.log(`  - ${tier.display_name} (${tier.name}): Rp ${tier.price.toLocaleString('id-ID')}/bulan`)
    console.log(`    Max properties: ${tier.features.max_properties ?? 'Unlimited'}`)
    console.log(`    Max images: ${tier.features.max_images_per_property}`)
    console.log(`    Featured listing: ${tier.features.featured_listing ? '✓' : '✗'}`)
    console.log(`    Analytics: ${tier.features.analytics ? '✓' : '✗'}`)
    console.log(`    Priority support: ${tier.features.priority_support ? '✓' : '✗'}\n`)
  })

  console.log('🎉 Subscription tiers seed completed successfully!')
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
