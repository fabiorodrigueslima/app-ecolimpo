// Ícones dos materiais do guia de separação (traço simples, 24x24).

function Base({ children, tamanho = 22 }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const DESENHOS = {
  // Folha com linhas de texto
  papel: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 11h6M9 14h6M9 17h4" />
    </>
  ),
  // Caixa de papelão com fita
  papelao: (
    <>
      <path d="M3 8 12 4l9 4v9l-9 4-9-4z" />
      <path d="M3 8l9 4 9-4M12 12v9" />
      <path d="m7.5 6 9 4" />
    </>
  ),
  // Garrafa plástica
  plastico: (
    <>
      <path d="M10 2h4v3l2 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-3z" />
      <path d="M8 12h8M8 16h8" />
    </>
  ),
  // Pote de vidro com tampa
  vidro: (
    <>
      <rect x="7" y="3" width="10" height="3" rx="1" />
      <path d="M8 6h8l1 3v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9z" />
      <path d="M10 11v5" />
    </>
  ),
  // Lata de metal
  metal: (
    <>
      <ellipse cx="12" cy="5" rx="5" ry="2" />
      <path d="M7 5v14c0 1.1 2.2 2 5 2s5-.9 5-2V5" />
      <path d="M7 9c0 1.1 2.2 2 5 2s5-.9 5-2" />
    </>
  ),
  // Bandeja de isopor
  isopor: (
    <>
      <path d="M2 10h20l-2 7H4z" />
      <path d="M7 13h.01M11 13h.01M15 13h.01M9 15h.01M13 15h.01M17 14h.01" />
    </>
  ),
  // Caixa longa vida (leite/suco)
  longaVida: (
    <>
      <path d="M8 2h8v3l2 3v13H6V8l2-3z" />
      <path d="M8 5h8M6 8h12M10 12h4" />
    </>
  ),
  // Maçã
  alimentos: (
    <>
      <path d="M12 7c-2-1.5-6-1-6.5 3.5C5 15 8 21 10 21c1 0 1.4-.6 2-.6s1 .6 2 .6c2 0 5-6 4.5-10.5C18 6 14 5.5 12 7z" />
      <path d="M12 7c0-2 1-4 3-4" />
    </>
  ),
  // Xícara de café
  cafe: (
    <>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M3 21h14" />
      <path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" />
    </>
  ),
  // Fralda
  fralda: (
    <>
      <path d="M3 6h18v4a9 9 0 0 1-6 8.5V18h-6v.5A9 9 0 0 1 3 10z" />
      <path d="M3 9h3M18 9h3" />
    </>
  ),
  // Papel com mancha de gordura
  papelEngordurado: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M12 10c1.5 2 2.5 3.2 2.5 4.5a2.5 2.5 0 0 1-5 0c0-1.3 1-2.5 2.5-4.5z" />
    </>
  ),
  // Rolo de papel higiênico
  banheiro: (
    <>
      <ellipse cx="9" cy="8" rx="5" ry="5" />
      <circle cx="9" cy="8" r="1.5" />
      <path d="M14 8v9H4" />
      <path d="M4 13v4" />
      <path d="M14 17h6v4h-6z" />
    </>
  ),
  // Camiseta rasgada
  tecido: (
    <>
      <path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a3 3 0 0 1-6 0z" />
      <path d="m10 14 2 2-1 2 2 1" />
    </>
  ),
  // Galho com folhas (podas)
  galho: (
    <>
      <path d="M3 19 20 6" />
      <path d="m9 14.5 1-4.5M14 10.5l4 .5" />
      <path d="M10 10c-2-1-2.5-3-1.5-5 2 .6 2.8 2.6 1.5 5zM18 11c1.8-1.4 3.8-1 5 .7-1.8 1.3-3.8 1-5-.7z" />
    </>
  ),
  // Folha (grama e folhas)
  folha: (
    <>
      <path d="M5 19C4 11 9 5 20 4c0 9-5 15-15 15z" />
      <path d="M5 19 14 10" />
    </>
  ),
  // Pegada de animal
  animal: (
    <>
      <path d="M12 12c-3 0-6 3.5-6 6 0 1.5 1 2.5 2.5 2.5 1.3 0 2.2-.8 3.5-.8s2.2.8 3.5.8c1.5 0 2.5-1 2.5-2.5 0-2.5-3-6-6-6z" />
      <circle cx="6" cy="9" r="1.6" />
      <circle cx="10" cy="5.5" r="1.6" />
      <circle cx="14" cy="5.5" r="1.6" />
      <circle cx="18" cy="9" r="1.6" />
    </>
  ),
};

export function IconeMaterial({ nome, tamanho }) {
  const desenho = DESENHOS[nome];
  if (!desenho) return null;
  return <Base tamanho={tamanho}>{desenho}</Base>;
}

// Lixeira (cabeçalho de "Orgânicos e rejeitos")
export function IconeLixeira({ tamanho = 26 }) {
  return (
    <Base tamanho={tamanho}>
      <path d="M4 7h16M10 7V4h4v3M6 7l1 14h10l1-14" />
      <path d="M10 11v6M14 11v6" />
    </Base>
  );
}
