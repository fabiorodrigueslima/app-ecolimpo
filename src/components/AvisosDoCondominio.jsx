import { useEffect, useState } from "react";
import { banco, BANCO_LIGADO } from "../lib/config.js";
import { rotuloDataAviso } from "../lib/avisos.js";

// Avisos da cooperativa para o condomínio do morador (ex.: ação de mobilização).
// Vêm do banco (supabase/016_avisos.sql) e somem sozinhos depois do dia da ação.
// Sem internet ou sem banco, não mostra nada.
export default function AvisosDoCondominio({ condominio }) {
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    if (!BANCO_LIGADO || !condominio?.id || condominio.exemplo) return undefined;
    let ativo = true;
    banco.consultar("avisos_do_condominio", { p_id: condominio.id }).then((r) => {
      if (ativo && r.ok && Array.isArray(r.dados)) setAvisos(r.dados);
    });
    return () => {
      ativo = false;
    };
  }, [condominio?.id, condominio?.exemplo]);

  if (avisos.length === 0) return null;
  return (
    <section className="avisos-morador" aria-label="Avisos da cooperativa">
      {avisos.map((aviso) => (
        <article key={aviso.id} className="aviso-morador">
          <p className="aviso-morador-topo">
            <span aria-hidden="true">📢</span> Aviso da cooperativa · {rotuloDataAviso(aviso.data)}
          </p>
          <p className="aviso-morador-texto">{aviso.texto}</p>
        </article>
      ))}
    </section>
  );
}
