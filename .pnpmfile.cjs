// typescript-eslint is only used by `pnpm lint:react` to parse TS/TSX for the
// eslint-plugin-react-hooks rules. It needs the TypeScript JS compiler API,
// which the native TypeScript 7 package used by the rest of the repo no longer
// ships, so those packages get their own TypeScript 5 instead of the peer.
const TS5 = '5.9.3'
const NEEDS_TS5 = /^(@typescript-eslint\/|typescript-eslint$|ts-api-utils$)/

function readPackage(pkg) {
  if (NEEDS_TS5.test(pkg.name) && pkg.peerDependencies?.typescript) {
    delete pkg.peerDependencies.typescript
    if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.typescript
    pkg.dependencies = { ...pkg.dependencies, typescript: TS5 }
  }
  return pkg
}

module.exports = { hooks: { readPackage } }
