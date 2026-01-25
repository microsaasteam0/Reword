#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.development')

const configs = {
  local: 'NEXT_PUBLIC_API_URL=http://localhost:8000',
  production: 'NEXT_PUBLIC_API_URL=https://snippetstream-api22-production.up.railway.app',
  deployed: 'NEXT_PUBLIC_API_URL=https://snippetstream-api22-production.up.railway.app'
}

const mode = process.argv[2]

if (!mode || !configs[mode]) {
  console.error('Usage: node switch-api.js [local|production|deployed]')
  console.error('Available modes:')
  console.error('  local      - Use local backend (http://localhost:8000)')
  console.error('  production - Use Railway backend (https://snippetstream-api22-production.up.railway.app)')
  console.error('  deployed   - Use Railway backend (https://snippetstream-api22-production.up.railway.app)')
  process.exit(1)
}

try {
  // Read current .env.development file
  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  // Update or add the API URL
  const lines = envContent.split('\n')
  let updated = false

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('NEXT_PUBLIC_API_URL=')) {
      lines[i] = configs[mode]
      updated = true
      break
    }
  }

  if (!updated) {
    lines.push(configs[mode])
  }

  // Ensure other required env vars exist
  const requiredVars = [
    'NODE_ENV=development',
    'PORT=3000',
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID=812229233766-ro0kem734rb7q9rn0h07fmcrouqdb6ft.apps.googleusercontent.com'
  ]

  requiredVars.forEach(envVar => {
    const key = envVar.split('=')[0]
    const exists = lines.some(line => line.startsWith(`${key}=`))
    if (!exists) {
      lines.push(envVar)
    }
  })

  // Write back to file
  fs.writeFileSync(envPath, lines.join('\n'))

  console.log(`✅ API endpoint switched to ${mode}: ${configs[mode].split('=')[1]}`)
} catch (error) {
  console.error('❌ Error switching API endpoint:', error.message)
  process.exit(1)
}