import { createClient } from '@/lib/supabase/server'

interface Province {
  id: string
  nama: string
  latitude: number
  longitude: number
}

interface City {
  id: string
  nama: string
  latitude: number
  longitude: number
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

function getCityType(nama: string): 'kota' | 'kabupaten' {
  if (nama.toUpperCase().includes('KOTA')) return 'kota'
  return 'kabupaten'
}

function cleanCityName(nama: string): string {
  return nama
    .replace(/^(KAB\.|KOTA)\s+/i, '')
    .replace(/^(KABUPATEN|KOTA)\s+/i, '')
    .replace(/^ADM\.\s+/i, '')
    .trim()
}

async function main() {
  console.log('🌏 Starting Indonesian region seed...\n')

  const supabase = await createClient()

  console.log('📥 Fetching provinces from API...')
  const provinceResponse = await fetch('https://ibnux.github.io/data-indonesia/provinsi.json')
  const provinces: Province[] = await provinceResponse.json()
  console.log(`✅ Fetched ${provinces.length} provinces\n`)

  const provinceInserts = provinces.map(p => ({
    code: p.id,
    name: p.nama,
    slug: generateSlug(p.nama)
  }))

  console.log('💾 Inserting provinces into database...')
  const { data: insertedProvinces, error: provinceError } = await supabase
    .from('provinces')
    .upsert(provinceInserts, { onConflict: 'code', ignoreDuplicates: false })
    .select()

  if (provinceError) {
    console.error('❌ Error inserting provinces:', provinceError)
    process.exit(1)
  }

  console.log(`✅ Inserted ${insertedProvinces?.length || 0} provinces\n`)

  const provinceIdMap = new Map<string, string>()
  insertedProvinces?.forEach(p => {
    provinceIdMap.set(p.code, p.id)
  })

  let totalCities = 0
  const allCityInserts: any[] = []

  for (const province of provinces) {
    console.log(`📥 Fetching cities for ${province.nama}...`)
    
    try {
      const cityResponse = await fetch(
        `https://ibnux.github.io/data-indonesia/kabupaten/${province.id}.json`
      )
      
      if (!cityResponse.ok) {
        console.log(`⚠️  No cities found for ${province.nama} (${cityResponse.status})`)
        continue
      }

      const cities: City[] = await cityResponse.json()
      const provinceId = provinceIdMap.get(province.id)

      if (!provinceId) {
        console.error(`❌ Province ID not found for code ${province.id}`)
        continue
      }

      const cityInserts = cities.map(c => ({
        province_id: provinceId,
        code: c.id,
        name: cleanCityName(c.nama),
        slug: generateSlug(cleanCityName(c.nama)),
        type: getCityType(c.nama)
      }))

      allCityInserts.push(...cityInserts)
      totalCities += cities.length
      console.log(`   ✅ ${cities.length} cities`)

    } catch (error) {
      console.error(`❌ Error fetching cities for ${province.nama}:`, error)
    }
  }

  console.log(`\n💾 Inserting ${totalCities} cities into database...`)
  
  const batchSize = 100
  for (let i = 0; i < allCityInserts.length; i += batchSize) {
    const batch = allCityInserts.slice(i, i + batchSize)
    
    const { error: cityError } = await supabase
      .from('cities')
      .upsert(batch, { 
        onConflict: 'province_id,slug',
        ignoreDuplicates: false 
      })

    if (cityError) {
      console.error(`❌ Error inserting cities batch ${i / batchSize + 1}:`, cityError)
      process.exit(1)
    }

    console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1} inserted (${Math.min(i + batchSize, allCityInserts.length)}/${allCityInserts.length})`)
  }

  console.log('\n📊 Verification...')
  
  const { count: provinceCount } = await supabase
    .from('provinces')
    .select('*', { count: 'exact', head: true })

  const { count: cityCount } = await supabase
    .from('cities')
    .select('*', { count: 'exact', head: true })

  console.log(`\n✅ Seed completed successfully!`)
  console.log(`   📍 Provinces: ${provinceCount}`)
  console.log(`   🏙️  Cities: ${cityCount}`)
  
  console.log('\n🔍 Sample data from DKI Jakarta:')
  const { data: jakartaCities } = await supabase
    .from('cities')
    .select('name, slug, type, provinces!inner(name)')
    .eq('provinces.code', '31')
    .limit(5)

  jakartaCities?.forEach(city => {
    console.log(`   - ${city.name} (${city.type}) → /provinsi/dki-jakarta/kota/${city.slug}`)
  })

  console.log('\n✨ Done!')
  process.exit(0)
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
