import { Link } from "react-router-dom";

export default function NaoEncontrada() {
  return (
    <div className="pagina obrigado">
      <h1>Página não encontrada</h1>
      <p>Esse endereço não existe no app.</p>
      <Link to="/" className="botao botao-primario botao-largo">
        Voltar ao início
      </Link>
    </div>
  );
}
