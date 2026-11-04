(() => {
  "use strict";

  // Escreva os recados aqui, na ordem em que a Isabelly deve recebê-los.
  const mensagens = [
    "Quando vejo um girassol, penso em você. Aí fico sorrindo pra uma flor no meio da rua. Achei justo te contar de quem é a culpa.",
    "Queria te emprestar meus olhos por um minutinho. Só pra você ver o quanto eu acho bonito esse seu jeito de dar cor às coisas.",
    "Se hoje o estudo cansar, imagina que deixei uma cadeira aqui no jardim pra você. Eu puxaria a outra pra perto, baixaria o volume da música e ficaria te fazendo companhia.",
    "Tem música de MPB que dá vontade de ouvir de olhos fechados. Tem outra que dá vontade de dividir um fone com você. Minha playlist tá ficando cheia dessas.",
    "Se um dia você me ensinar a pintar um lírio, já sei qual vai ser a parte mais difícil. Vou ter que prestar atenção no papel com você bem ali do lado.",
    "Num filme de animação sobre a minha semana, o coração do personagem ia fazer um barulhinho toda vez que aparecesse seu nome na tela. O personagem sou eu, caso o desenho não fique parecido.",
    "Hoje eu queria estar na arquibancada com você. Acho que, se o Corinthians fizesse gol, eu ia acabar olhando mais pra sua comemoração do que pro replay.",
    "Quando sair o resultado da faculdade, eu quero muito ouvir você contar como foi. Enquanto esse dia não chega, já tem alguém aqui torcendo por você até nos dias de simulado.",
    "Tô com vontade de te chamar pra uma tarde de tinta, papel e violão baixinho. Posso ficar com a tarefa de lavar os pincéis se você escolher a música.",
    "Se pudesse guardar um pedacinho de sol num envelope, eu te mandava pelo correio. Por enquanto, vai esse girassol de bolso e um beijo dobradinho junto.",
    "Tentei escolher a flor mais bonita desse jardim pra te dar. Fiquei entre um lírio e um girassol. No fim, achei mais a minha cara exagerar um pouquinho e te dar os dois.",
    "Gosto de você, Isabelly. Hoje deu vontade de escrever isso assim, com todas as letras. E deixar um coração no cantinho da folha, igual a quem torce pra você reparar."
  ];

  const chave = "jardim-isabelly.proximo-bilhete.v1";
  const janela = document.getElementById("welcome");
  let proximoNestaPagina = null;

  function escolherIndice() {
    for (const nome of ["localStorage", "sessionStorage"]) {
      try {
        const armazenamento = window[nome];
        const guardado = Number(armazenamento.getItem(chave));
        const indice = Number.isInteger(guardado) && guardado >= 0 && guardado < mensagens.length ? guardado : 0;
        armazenamento.setItem(chave, String((indice + 1) % mensagens.length));
        return indice;
      } catch { /* Navegadores podem restringir o armazenamento de arquivos locais. */ }
    }
    const indice = proximoNestaPagina ?? Math.floor(Math.random() * mensagens.length);
    proximoNestaPagina = (indice + 1) % mensagens.length;
    return indice;
  }

  function abrirBilhete() {
    const indice = escolherIndice();
    document.getElementById("welcome-message").textContent = mensagens[indice];
    document.getElementById("welcome-count").textContent = `BILHETE ${String(indice + 1).padStart(2, "0")}/${mensagens.length}`;
    if (!janela.open) janela.showModal();
  }

  document.getElementById("welcome-enter").addEventListener("click", () => janela.close());
  // Cobre tanto uma nova carga quanto o retorno pelo histórico com a página em cache.
  window.addEventListener("pageshow", (evento) => {
    if (evento.persisted) abrirBilhete();
  });
  abrirBilhete();
})();
