export function getSearchParam(name, fallbackValue = "") {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || fallbackValue;
}

export function getCurrentProjectSlug(fallbackValue = "") {
  return getSearchParam("slug", fallbackValue);
}
