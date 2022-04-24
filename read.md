## mywebpack 学习

(webpack 底层原理实现)[https://zhuanlan.zhihu.com/p/408733746]

### 整体流程

1. 转化为 ast

```js
const fs = require("fs");
const babylon = require("babylon");

const entryPath = "./source/entry.js";

const createAsset = (filename) => {
  const content = fs.readFileSync(filename, "utf-8");
  const dependencies = [];

  const ast = babylon.parse(content, {
    sourceType: "module",
  });
  console.log("ast", ast);
  // traverse(ast, {
  // ImportDeclaration: ({ node }) => {
  // dependencies.push(node.source.value);
  // },
  // });

  // const { code } = babel.transformFromAst(ast, null, {
  // presets: ["env"],
  // });

  // const id = ID++;

  return {
    filename,
    // id,
    dependencies,
    // code,
  };
};

createAsset(entryPath);
```

首先将整体转化为 ast，使用 babylon 来做的转换。

2. 引入 dependencies
   通过 babel-traverse，获取 ast 中 import 进来的 path

```js
const fs = require("fs");
const babylon = require("babylon");
const traverse = require("babel-traverse").default;

const entryPath = "./source/entry.js";

const createAsset = (filename) => {
  const content = fs.readFileSync(filename, "utf-8");
  const dependencies = [];

  const ast = babylon.parse(content, {
    sourceType: "module",
  });
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  console.log("dependencies", dependencies);

  // const { code } = babel.transformFromAst(ast, null, {
  // presets: ["env"],
  // });

  // const id = ID++;

  return {
    filename,
    // id,
    dependencies,
    // code,
  };
};
```

通过 createAsset，我们获得了文件名和对应的依赖路径。

3. 添加 asset 的 id
   每一个 asset，添加唯一 id

```js
let ID = 0;
```

```js
const fs = require("fs");
const babylon = require("babylon");
const traverse = require("babel-traverse").default;

let ID = 0;

const createAsset = (filename) => {
  const content = fs.readFileSync(filename, "utf-8");

  const ast = babylon.parse(content, {
    sourceType: "module",
  });

  const dependencies = [];

  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  const id = ID++;

  return {
    id,
    filename,
    dependencies,
  };
};
```

4. 构建依赖路径图

```js
const createGraph = (entry) => {
  const mainAsset = createAsset(entry);
  return mainAsset;
};

createGraph(entryPath);
```

5. 使用 path 来解析整体依赖图路径
   我们将 mainAsset 放入 allAssets 数组中

```js
const path = require("path");

const createGraph = (entry) => {
  const mainAsset = createAsset(entry);

  allAssets = [mainAsset];

  for (let asset of allAsset) {
    const dirname = path.dirname(asset.filename);

    asset.mapping = {};

    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const childAsset = createAsset(absolutePath);
      asset.mapping[relativePath] = childAsset.id;
      // 将子asset推入asset图中，for of迭代器继续处理
      allAssets.push(childAsset);
    });
  }

  return mainAsset;
};

createGraph(entryPath);
```

6. 创建 bundle

```js
const path = require("path");

const createGraph = (entry) => {
  const mainAsset = createAsset(entry);

  allAssets = [mainAsset];

  for (let asset of allAsset) {
    const dirname = path.dirname(asset.filename);

    asset.mapping = {};

    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const childAsset = createAsset(absolutePath);
      asset.mapping[relativePath] = childAsset.id;
      // 将子asset推入asset图中，for of迭代器继续处理
      allAssets.push(childAsset);
    });
  }

  return mainAsset;
};

const bundle = (graph) => {
  return graph;
};

const graph = createGraph(entryPath);

const bundledAsset = bundle(graph);
```

7. bundle 输出代码

```js
const bundle = (graph) => {
  let modules = "";

  graph.forEach((module) => {
    modules += `${module.id}:[

    ]`;
  });

  // 最终结果是一个立即执行函数
  const result = `(() => {})(${modules})`;
  return result;
};
```

8. bundle 输出代码

通过 babel-core 和 babel-preset-env，将 ast 解析为代码

```js
const babel = require("babel-core");

let ID = 0;

function createAsset(filename) {
  const content = fs.readFileSync(filename, "utf-8");

  const ast = babylon.parse(content, {
    sourceType: "module",
  });

  const dependencies = [];

  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  const id = ID++;

  const { code } = babel.transformFromAst(ast, null, {
    presets: ["env"],
  });

  return {
    id,
    filename,
    dependencies,
    code,
  };
}
```

9. 完成 bundle 输出

```js
const bundle = (graph) => {
  let modules = "";

  graph.forEach((module) => {
    modules += `${module.id}:[
      (require, module, export) => {
        ${module.code}
      },
      ${module.mapping}
    ]`;
  });

  // 最终结果是一个立即执行函数
  // localRequire每个module作用域中执行的时候，都会创建一次
  const result = `((modules) => {
    const require(id) => {
      const [fn, mapping] = modules[id]
      const localRequire = relativePath => require(mapping[relativePath])
      const module = { exports: {} }
      fn(localRequire, module, module.exports)
      return module.exports
    };
    require(0);
  })(${modules})`;
  return result;
};

const result = bundle(graph);

fs.writeFileSync("./bundle.js", result);
```

即可输出完成代码到 bundle.js 中，将起 copy 入浏览器中即可执行结果。
