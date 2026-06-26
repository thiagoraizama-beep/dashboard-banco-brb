import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data", "programacoes.json");

async function readAll() {
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

async function writeAll(programacoes) {
  await fs.writeFile(DATA_FILE, JSON.stringify(programacoes, null, 2), "utf-8");
}

export async function listProgramacoes({ start, end } = {}) {
  const all = await readAll();
  if (!start || !end) return all;
  return all.filter((p) => p.data >= start && p.data <= end);
}

export async function createProgramacao({ veiculo, categoria, programa, data, horaInicio, horaFim }) {
  if (!veiculo || !programa || !data || !horaInicio || !horaFim) {
    throw new Error("Campos obrigatorios: veiculo, programa, data, horaInicio, horaFim");
  }

  const programacoes = await readAll();
  const nova = {
    id: randomUUID(),
    veiculo,
    categoria: categoria || null,
    programa,
    data,
    horaInicio,
    horaFim,
    criadoEm: new Date().toISOString(),
  };

  programacoes.push(nova);
  await writeAll(programacoes);
  return nova;
}

export async function updateProgramacao(id, { veiculo, categoria, programa, data, horaInicio, horaFim }) {
  if (!veiculo || !programa || !data || !horaInicio || !horaFim) {
    throw new Error("Campos obrigatorios: veiculo, programa, data, horaInicio, horaFim");
  }

  const programacoes = await readAll();
  const index = programacoes.findIndex((p) => p.id === id);
  if (index === -1) return null;

  programacoes[index] = { ...programacoes[index], veiculo, categoria: categoria || null, programa, data, horaInicio, horaFim };
  await writeAll(programacoes);
  return programacoes[index];
}

export async function listProgramas() {
  const all = await readAll();
  return [...new Set(all.map((p) => p.programa))].filter(Boolean).sort();
}

export async function deleteProgramacao(id) {
  const programacoes = await readAll();
  const filtered = programacoes.filter((p) => p.id !== id);
  await writeAll(filtered);
  return filtered.length !== programacoes.length;
}
