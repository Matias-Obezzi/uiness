import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('registry.json', () => {
  it('is valid and internally consistent', () => {
    const registryPath = join(__dirname, '../registry.json')
    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'))
    const items = registry.items

    const errors: string[] = []

    // 1. Nombres únicos
    const itemNames = new Set<string>()
    for (const item of items) {
      if (itemNames.has(item.name)) {
        errors.push(`Duplicate item name: ${item.name}`)
      }
      itemNames.add(item.name)
    }

    let coveredItems = 0
    let coveredDeps = 0
    let coveredImports = 0

    for (const item of items) {
      coveredItems++

      const itemDeps = item.registryDependencies || []
      const itemDepNames = new Set(
        itemDeps.map((d: string) => (d.startsWith('@uiness/') ? d.replace('@uiness/', '') : d)),
      )

      // 6. Sin auto-referencia
      if (itemDeps.includes(`@uiness/${item.name}`)) {
        errors.push(`Item '${item.name}' lists itself in registryDependencies.`)
      }

      for (const dep of itemDeps) {
        coveredDeps++

        // 3. Dependencias locales namespaceadas
        if (!dep.startsWith('@uiness/') && itemNames.has(dep)) {
          errors.push(
            `Item '${item.name}' has naked dependency '${dep}'. ` +
              `It matches a local item but lacks the '@uiness/' prefix. ` +
              `The shadcn CLI resolves naked names against its default registry and will install the wrong component or fail with 'item not found'.`,
          )
        }

        // 4. No dependencias colgantes
        if (dep.startsWith('@uiness/')) {
          const localName = dep.replace('@uiness/', '')
          if (!itemNames.has(localName)) {
            errors.push(
              `Item '${item.name}' depends on '@uiness/${localName}' but it does not exist in the registry.`,
            )
          }
        }
      }

      const files = item.files || []
      for (const file of files) {
        // 2. Archivos existen y el tipo coincide
        const filePath = join(__dirname, '..', file.path)
        if (!existsSync(filePath)) {
          errors.push(`Item '${item.name}' file '${file.path}' does not exist on disk.`)
        }

        if (file.type !== item.type) {
          errors.push(
            `Item '${item.name}' file '${file.path}' has type '${file.type}', but the item has type '${item.type}'.`,
          )
        }

        // 5. Imports declarados
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8')
          const importRegex = /from\s+['"]@\/([^'"]+)['"]/g
          const matches = Array.from(content.matchAll(importRegex))

          for (const match of matches) {
            const importPath = match[1]
            if (!importPath) continue

            // map path to item name
            let mappedName = ''
            if (importPath === 'lib/utils') {
              mappedName = 'utils'
            } else if (importPath.startsWith('hooks/')) {
              mappedName = importPath.replace('hooks/', '')
            } else if (importPath.startsWith('ui/')) {
              mappedName = importPath.replace('ui/', '')
            }

            if (!mappedName) continue
            coveredImports++

            if (!itemNames.has(mappedName)) {
              errors.push(
                `Item '${item.name}' imports '@/${importPath}', but there is no '${mappedName}' item in the registry. ` +
                  `The file would be installed without its dependency and break the consumer's build.`,
              )
              continue
            }

            if (!itemDepNames.has(mappedName)) {
              errors.push(
                `Item '${item.name}' imports '@/${importPath}' but '${mappedName}' is not declared in its registryDependencies.`,
              )
            }
          }
        }
      }
    }

    // Log the coverage so we can report it
    console.log(
      `Coverage: ${coveredItems} items, ${coveredDeps} dependencies, ${coveredImports} imports verified.`,
    )

    expect(errors).toEqual([])
  })
})
