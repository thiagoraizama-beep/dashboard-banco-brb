import { toFilterList } from "./filterUtils.js";

// Plataformas (nomes de veiculo na planilha) que cada vinculo de campanha autoriza.
// Para "veiculo" e "parceiro", a fonte de verdade sao os escopos (campanha+canais)
// resolvidos em authService.resolveEscopos a partir de campanha_veiculos.
function plataformasPermitidas(user) {
  const escopos = Array.isArray(user.escopos) ? user.escopos : [];
  const chave = user.papel === "parceiro" ? "canais" : "plataformas";
  return [...new Set(escopos.flatMap((e) => e[chave] || []))];
}

// Restringe o filtro de veiculo pedido pelo client a interseccao com o que o usuario
// tem permissao de ver.
// - papel "veiculo": restrito a uniao das plataformas de todos os seus vinculos de campanha
// - papel "parceiro" (sistema antigo): restrito aos canais dos seus escopos
// - demais papeis (agencia, cliente): sem restricao
export function scopeVeiculoFilter(user, veiculoPedido) {
  if (user.papel !== "veiculo" && user.papel !== "parceiro") return veiculoPedido;

  const permitidos = plataformasPermitidas(user);
  // Escopos vazios = sem acesso a nada (retorna lista vazia, nunca null)
  const pedidos = toFilterList(veiculoPedido);
  if (!pedidos) return permitidos;
  return pedidos.filter((v) => permitidos.includes(v));
}

// Restringe o filtro de campanha: usuarios "veiculo"/"parceiro" so podem ver as
// campanhas presentes nos seus vinculos.
export function scopeCampanhaFilter(user, campanhaPedida) {
  if (user.papel !== "veiculo" && user.papel !== "parceiro") return campanhaPedida;

  const escopos = Array.isArray(user.escopos) ? user.escopos : [];
  const campanhasPermitidas = [...new Set(escopos.map((e) => e.campanha))];

  // Escopos vazios = sem acesso a nenhuma campanha (retorna lista vazia, nunca null)
  const pedidas = toFilterList(campanhaPedida);
  if (!pedidas) return campanhasPermitidas;
  return pedidas.filter((c) => campanhasPermitidas.includes(c));
}

// Tipos de midia (online/offline/ambos) que o usuario tem em pelo menos um vinculo,
// usado pelo frontend para decidir quais paginas mostrar no menu (ex: esconder
// "Midia Offline" se nenhum vinculo do usuario inclui offline).
export function tiposMidiaPermitidos(user) {
  if (user.papel !== "veiculo" && user.papel !== "parceiro") return ["online", "offline"];

  const escopos = Array.isArray(user.escopos) ? user.escopos : [];
  const tipos = new Set();
  for (const e of escopos) {
    const t = e.tipoMidia || "online";
    if (t === "ambos") {
      tipos.add("online");
      tipos.add("offline");
    } else {
      tipos.add(t);
    }
  }
  return [...tipos];
}

// True se o usuario tem permissao para acessar o tipo de midia informado
// ("online" ou "offline"). Usado como guarda de seguranca nas rotas de
// midia offline / midia online para usuarios "veiculo"/"parceiro".
export function temAcessoTipoMidia(user, tipo) {
  if (user.papel !== "veiculo" && user.papel !== "parceiro") return true;
  return tiposMidiaPermitidos(user).includes(tipo);
}
