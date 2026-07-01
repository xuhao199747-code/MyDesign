function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function methodNotAllowed(res) {
  json(res, 405, { error: "method_not_allowed" });
}

module.exports = {
  json,
  methodNotAllowed,
};
