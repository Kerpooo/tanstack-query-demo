// Carga las URLs de mfe/.env.<mode> (development o production). Las variables
// definidas en el entorno (p. ej. en el panel del hosting) tienen prioridad.
const fs = require('node:fs')
const path = require('node:path')
const { parseEnv } = require('node:util')

const KEYS = ['API_URL', 'TASKS_URL', 'USERS_URL', 'QUERY_LAB_URL']

function loadEnv(mode) {
  const file = path.join(__dirname, `.env.${mode}`)
  const fromFile = fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {}
  const env = {}
  for (const key of KEYS) {
    const value = (process.env[key] || fromFile[key] || '').replace(/\/+$/, '')
    if (!value) throw new Error(`Falta ${key}: defínala en mfe/.env.${mode} o en el entorno.`)
    env[key] = value
  }
  return env
}

module.exports = { loadEnv }
