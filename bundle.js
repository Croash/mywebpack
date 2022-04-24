(
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
  )({0:[
      (require, module, exports) => {"use strict";

var _message = require("./message.js");

var _message2 = _interopRequireDefault(_message);

var _submsg = require("./submsg.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log(_submsg.submsg + _message2.default);},
      {"./message.js":1,"./submsg.js":2}
    ],1:[
      (require, module, exports) => {"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _name = require("./name.js");

exports.default = _name.name + " is a boy";},
      {"./name.js":3}
    ],2:[
      (require, module, exports) => {"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var submsg = exports.submsg = 'submsg ';},
      {}
    ],3:[
      (require, module, exports) => {"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var name = exports.name = 'xiaoming';},
      {}
    ],})