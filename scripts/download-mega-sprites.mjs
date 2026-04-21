import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const MEGA_EVOLUTIONS_PATH = path.join(
  repoRoot,
  'backend/src/main/resources/data/regulation-m-a/mega-evolutions.json',
)
const OUTPUT_DIR = path.join(repoRoot, 'frontend/public/sprites')

const CLASSIC_SPRITES_PAGE_BASE = 'https://pokemondb.net/sprites'
const CLASSIC_ARTWORK_BASE = 'https://img.pokemondb.net/artwork/vector'
const LEGENDS_ZA_ARTICLE_URL =
  'https://www.pokebeach.com/2026/01/official-artwork-of-all-legends-z-a-mega-evolutions-revealed'

const TYPE_NAMES = new Set([
  'BUG',
  'DARK',
  'DRAGON',
  'ELECTRIC',
  'FAIRY',
  'FIGHTING',
  'FIRE',
  'FLYING',
  'GHOST',
  'GRASS',
  'GROUND',
  'ICE',
  'NORMAL',
  'POISON',
  'PSYCHIC',
  'ROCK',
  'STEEL',
  'WATER',
])

export function buildMegaSpriteFilename(speciesId) {
  return `${speciesId}-mega.png`
}

export function buildReadableMirrorUrl(url) {
  return `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`
}

export function buildClassicArtworkUrl(megaFormId) {
  return `${CLASSIC_ARTWORK_BASE}/${megaFormId}.png`
}

function buildClassicSpritesPageUrl(speciesId) {
  return `${CLASSIC_SPRITES_PAGE_BASE}/${speciesId}`
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const megaGroups = await loadMegaGroups()
  const legendsZAMapPromise = loadLegendsZAArticleMap()

  let fetched = 0
  let skipped = 0
  let failed = 0

  console.log(
    `Preparing mega sprite bundle for ${megaGroups.length} species in ${path.relative(
      repoRoot,
      OUTPUT_DIR,
    )}`,
  )

  for (const group of megaGroups) {
    const destination = path.join(OUTPUT_DIR, buildMegaSpriteFilename(group.speciesId))

    if (await fileExists(destination)) {
      skipped += 1
      console.log(`skip  ${group.speciesId} -> existing file`)
      continue
    }

    try {
      const sourceUrl = await resolveSourceUrl(group, legendsZAMapPromise)
      const response = await fetch(sourceUrl)
      if (!response.ok) {
        throw new Error(
          `Download failed for ${group.speciesId}: ${response.status} ${response.statusText}`,
        )
      }

      const image = Buffer.from(await response.arrayBuffer())
      await writeFile(destination, image)
      fetched += 1
      console.log(
        `write ${group.speciesId} -> ${path.relative(
          repoRoot,
          destination,
        )} (${sourceUrl})`,
      )
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : String(error)
      console.log(`fail  ${group.speciesId} -> ${message}`)
    }
  }

  console.log('')
  console.log(`Fetched: ${fetched}`)
  console.log(`Skipped existing: ${skipped}`)
  console.log(`Failed: ${failed}`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

async function loadMegaGroups() {
  const megaEvolutions = JSON.parse(await readFile(MEGA_EVOLUTIONS_PATH, 'utf8'))
  const groups = new Map()

  for (const entry of megaEvolutions) {
    if (!groups.has(entry.speciesId)) {
      groups.set(entry.speciesId, [])
    }
    groups.get(entry.speciesId).push(entry)
  }

  return [...groups.entries()].map(([speciesId, entries]) => ({
    speciesId,
    entries,
  }))
}

async function resolveSourceUrl(group, legendsZAMapPromise) {
  const legendsZASource = await resolveLegendsZASource(group, legendsZAMapPromise)
  if (legendsZASource !== null) {
    return legendsZASource
  }

  const classicMegaId = await resolveClassicMegaId(group)
  return buildClassicArtworkUrl(classicMegaId)
}

async function resolveLegendsZASource(group, legendsZAMapPromise) {
  const legendsZAMap = await legendsZAMapPromise

  for (const entry of group.entries) {
    for (const key of buildArticleLookupKeys(entry.name)) {
      const sourceUrl = legendsZAMap.get(key)
      if (sourceUrl) {
        return sourceUrl
      }
    }
  }

  return null
}

async function loadLegendsZAArticleMap() {
  const markdown = await fetchMirroredText(LEGENDS_ZA_ARTICLE_URL)
  return parseLegendsZAArticle(markdown)
}

function parseLegendsZAArticle(markdown) {
  const articleMap = new Map()
  let currentLabel = null

  for (const line of markdown.split(/\r?\n/)) {
    const headingMatch = line.match(/^\*\*(Mega [^*]+?)\*\*/)
    if (headingMatch) {
      currentLabel = normalizeMegaLabel(stripTrailingTypeDescriptor(headingMatch[1]))
      continue
    }

    const imageMatch = line.match(/\[!\[Image \d+\]\([^)]*\)\]\((https?:\/\/[^)]+)\)/)
    if (currentLabel !== null && imageMatch && !articleMap.has(currentLabel)) {
      articleMap.set(currentLabel, imageMatch[1])
    }
  }

  return articleMap
}

async function resolveClassicMegaId(group) {
  const markdown = await fetchMirroredText(
    buildClassicSpritesPageUrl(group.speciesId),
  )

  const candidates = group.entries
    .map((entry) => {
      const index = markdown.indexOf(`/${entry.id}.png`)
      return { id: entry.id, index }
    })
    .filter((candidate) => candidate.index !== -1)
    .sort((left, right) => left.index - right.index)

  if (candidates.length === 0) {
    throw new Error(
      `No classic mega artwork reference found on ${buildClassicSpritesPageUrl(
        group.speciesId,
      )}`,
    )
  }

  return candidates[0].id
}

async function fetchMirroredText(url) {
  const response = await fetch(buildReadableMirrorUrl(url))
  if (!response.ok) {
    throw new Error(
      `Mirror fetch failed for ${url}: ${response.status} ${response.statusText}`,
    )
  }
  return response.text()
}

function buildArticleLookupKeys(megaName) {
  const keys = new Set([normalizeMegaLabel(megaName)])

  const withoutGender = megaName.replace(/\s+\((Male|Female)\)$/i, '')
  if (withoutGender !== megaName) {
    keys.add(normalizeMegaLabel(withoutGender))
  }

  return [...keys]
}

function normalizeMegaLabel(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function stripTrailingTypeDescriptor(label) {
  const match = label.match(/^(.*)\(([^()]+)\)$/)
  if (!match) {
    return label
  }

  const descriptor = match[2]
    .split('/')
    .map((part) => part.trim().toUpperCase())

  if (descriptor.length > 0 && descriptor.every((part) => TYPE_NAMES.has(part))) {
    return match[1].trim()
  }

  return label
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

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
