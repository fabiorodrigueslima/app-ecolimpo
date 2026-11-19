// Ícones simples desenhados em SVG (sem biblioteca extra).

function Icone({ children, tamanho = 24, ...resto }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {children}
    </svg>
  );
}

export const IconeInicio = (p) => (
  <Icone {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M10 21v-6h4v6" />
  </Icone>
);

export const IconeCalendario = (p) => (
  <Icone {...p}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    <path d="m9 15 2 2 4-4" />
  </Icone>
);

export const IconeReciclar = (p) => (
  <Icone {...p}>
    <path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L5.5 12" />
    <path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2" />
    <path d="m14 16-3 3 3 3" />
    <path d="M8.3 7.3 9.9 4.6a1.8 1.8 0 0 1 3.1 0l3.9 6.7" />
    <path d="m13.5 10.6 3.4.7.9-3.3" />
    <path d="m5.5 12-.2 4M5.5 12l3.6 1.6" />
  </Icone>
);

export const IconeConversa = (p) => (
  <Icone {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />
    <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
  </Icone>
);

export const IconeSino = (p) => (
  <Icone {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a2 2 0 0 0 3.4 0" />
  </Icone>
);

export const IconeRelogio = (p) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icone>
);

export const IconePredio = (p) => (
  <Icone {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3" />
  </Icone>
);

export const IconeBusca = (p) => (
  <Icone {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icone>
);

export const IconeEstrela = (p) => (
  <Icone {...p}>
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" />
  </Icone>
);

export const IconeVoltar = (p) => (
  <Icone {...p}>
    <path d="M15 18 9 12l6-6" />
  </Icone>
);

export const IconeSeta = (p) => (
  <Icone {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icone>
);

export const IconeCheck = (p) => (
  <Icone {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icone>
);

export const IconeCompartilhar = (p) => (
  <Icone {...p}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </Icone>
);

export const IconeWhatsapp = (p) => (
  <Icone {...p}>
    <path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3.2 3.1Z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .8a4 4 0 0 1-2.1-2.1l.8-1-1-2Z" />
  </Icone>
);

export const IconeOlho = (p) => (
  <Icone {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icone>
);

export const IconeOlhoFechado = (p) => (
  <Icone {...p}>
    <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6" />
    <path d="M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m2 2 20 20" />
  </Icone>
);
