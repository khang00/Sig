"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var app = express_1["default"]();
var PORT = 8000;
app.get("/", function (req, res) {
  return res.send("Express + TypeScript Server");
});
app.listen(PORT, function () {
  console.log(
    "\u26A1\uFE0F[server]: Server is running at https://localhost:" + PORT
  );
});
//# sourceMappingURL=index.js.map
