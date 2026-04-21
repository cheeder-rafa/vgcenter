import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const POKEDEX_PATH = path.join(
  repoRoot,
  'backend/src/main/resources/data/regulation-m-a/pokedex.json',
)
const MEGA_EVOLUTIONS_PATH = path.join(
  repoRoot,
  'backend/src/main/resources/data/regulation-m-a/mega-evolutions.json',
)
const OUTPUT_DIR = path.join(repoRoot, 'frontend/public/sprites')

const POKEAPI_POKEMON_URL = 'https://pokeapi.co/api/v2/pokemon'
const OFFICIAL_ARTWORK_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const entries = await loadEntries()
  const manualPlacement = []

  console.log(
    `Preparing sprite bundle for ${entries.length} species/forms in ${path.relative(
      repoRoot,
      OUTPUT_DIR,
    )}`,
  )

  let downloaded = 0
  let skipped = 0

  for (const entry of entries) {
    const destination = path.join(OUTPUT_DIR, `${entry.id}.png`)

    if (await fileExists(destination)) {
      skipped += 1
      console.log(`skip  ${entry.id} -> existing file`)
      continue
    }

    try {
      const dexNumber = await resolveDexNumber(entry.id)
      const spriteUrl = `${OFFICIAL_ARTWORK_BASE}/${dexNumber}.png`
      const response = await fetch(spriteUrl)

      if (response.status === 404) {
        manualPlacement.push(entry)
        console.log(`miss  ${entry.id} -> artwork 404 (${spriteUrl})`)
        continue
      }

      if (!response.ok) {
        throw new Error(
          `Artwork download failed for ${entry.id}: ${response.status} ${response.statusText}`,
        )
      }

      const image = Buffer.from(await response.arrayBuffer())
      await writeFile(destination, image)
      downloaded += 1
      console.log(`write ${entry.id} -> ${path.relative(repoRoot, destination)}`)
    } catch (error) {
      if (isNotFoundError(error)) {
        manualPlacement.push(entry)
        console.log(`miss  ${entry.id} -> PokéAPI has no pokemon/${entry.id}`)
        continue
      }
      throw error
    }
  }

  console.log('')
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Skipped existing: ${skipped}`)
  console.log(`Needs manual placement: ${manualPlacement.length}`)

  if (manualPlacement.length > 0) {
    console.log('')
    console.log('Manual Legends Z-A Mega placement:')
    for (const entry of manualPlacement) {
      console.log(
        `- ${entry.id}: place maintainer-sourced artwork at frontend/public/sprites/${entry.id}.png`,
      )
    }
    console.log(
      "Use the maintainer's corrections brief / Reddit source for the missing Legends Z-A Mega artwork.",
    )
  } else {
    console.log('')
    console.log(
      'Manual Legends Z-A Mega placement: no missing entries were detected on this run.',
    )
    console.log(
      "If PokéAPI still lacks a future Mega form, place the maintainer-sourced PNG in frontend/public/sprites/<speciesId>.png.",
    )
  }
}

async function loadEntries() {
  const pokedex = JSON.parse(await readFile(POKEDEX_PATH, 'utf8'))
  const megaEvolutions = JSON.parse(await readFile(MEGA_EVOLUTIONS_PATH, 'utf8'))

  // Sprite filenames need both base roster ids and Mega form ids.
  const combined = [...pokedex, ...megaEvolutions].map((entry) => ({
    id: entry.id,
    name: entry.name,
  }))

  return [...new Map(combined.map((entry) => [entry.id, entry])).values()]
}

async function resolveDexNumber(speciesId) {
  const response = await fetch(
    `${POKEAPI_POKEMON_URL}/${encodeURIComponent(speciesId)}`,
  )

  if (response.status === 404) {
    throw new Error(`POKEMON_NOT_FOUND:${speciesId}`)
  }

  if (!response.ok) {
    throw new Error(
      `PokéAPI lookup failed for ${speciesId}: ${response.status} ${response.statusText}`,
    )
  }

  const payload = await response.json()
  if (typeof payload.id !== 'number') {
    throw new Error(`PokéAPI response for ${speciesId} did not include a numeric id`)
  }
  return payload.id
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

function isNotFoundError(error) {
  return error instanceof Error && error.message.startsWith('POKEMON_NOT_FOUND:')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
