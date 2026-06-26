// Aceita filtro como valor unico ou array (multi-selecao). Vazio/null/[] = sem filtro.
export function matchesFilter(rowValue, filterValue) {
  if (!filterValue) return true;
  if (Array.isArray(filterValue)) return filterValue.length === 0 || filterValue.includes(rowValue);
  return rowValue === filterValue;
}

// Normaliza um filtro (valor unico ou array) numa lista de valores, ou null se vazio.
export function toFilterList(filterValue) {
  if (!filterValue) return null;
  const list = Array.isArray(filterValue) ? filterValue : [filterValue];
  return list.length > 0 ? list : null;
}
