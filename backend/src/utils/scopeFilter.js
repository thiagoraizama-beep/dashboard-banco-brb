import { toFilterList } from "./filterUtils.js";

// Restringe o filtro de veiculo pedido pelo client a interseccao com o que o usuario
// (papel "veiculo") tem permissao de ver. Agencia e cliente nao tem restricao (veem tudo).
// Retorna o filtro de veiculo efetivo a ser usado pelo service (array, ou null = sem filtro).
export function scopeVeiculoFilter(user, veiculoPedido) {
  if (user.papel !== "veiculo") return veiculoPedido;

  const permitidos = user.veiculos || [];
  const pedidos = toFilterList(veiculoPedido);

  if (!pedidos) return permitidos;
  return pedidos.filter((v) => permitidos.includes(v));
}
