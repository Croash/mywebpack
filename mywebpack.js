const fs = require('fs')
const babylon = require('babylon')
const traverse = require('babel-traverse').default
const babel = require('babel-core')
const path = require('path')

let ID = 0

const createAsset = filename => {
  const content = fs.readFileSync(filename, 'utf-8')
  const dependencies = []

  const ast = babylon.parse(content, {
    sourceType: 'module'
  })
  traverse(ast, {
    ImportDeclaration: (({ node }) => {
      dependencies.push(node.source.value)
    })
  })

  const {
    code
  } = babel.transformFromAst(ast, null, {
    presets: ['env']
  })

  const id = ID++

  return {
    filename,
    id,
    dependencies,
    code,
  }

}

const createGraph = (entry) => {
  const mainAssets = createAsset(entry)
  const allAssets = [mainAssets]

  for(let asset of allAssets) {
    const dirname = path.dirname(asset.filename)

    asset.mapping = {}

    asset.dependencies.forEach(relativePath => {
      const absolutePath = path.join(dirname, relativePath)
      const childAsset = createAsset(absolutePath)
      asset.mapping[relativePath] = childAsset.id
      allAssets.push(childAsset)
    })
  }

  return allAssets
}

const bundle = graph => {
  let modules = ''

  graph.forEach(module => {
    modules += `${module.id}:[
      (require, module, exports) => {${module.code}},
      ${JSON.stringify(module.mapping)}
    ],`
  })

  const result = `(
    function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id]
        const localRequire = relativePath => require(mapping[relativePath])
        const module = { exports: {} }
        fn(localRequire, module, module.exports)
        return module.exports
      }
      require(0)
    }
  )({${modules}})`

  return result
}

const graph = createGraph('./source/entry.js')

const result = bundle(graph)

fs.writeFileSync('./bundle.js', result)
console.log(result)
