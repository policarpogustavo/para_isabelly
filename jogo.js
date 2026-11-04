/* Jardim da Isabelly. JavaScript clássico para abrir também pelo arquivo local. */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const icon = (id, className = "icon") =>
    `<svg class="${className}" aria-hidden="true" focusable="false"><use href="#${id}"></use></svg>`;
  const chapters = [
    { name: "Caça às flores", sprite: "flor", copy: "Colha 3 girassóis e 2 lírios para montar o seu primeiro buquê.", action: "Começar jogo" },
    { name: "Ateliê de cores", sprite: "paleta", copy: "O buquê virou desenho. Escolha suas tintas e dê suas cores a cada pedacinho do cartão.", action: "Abrir ateliê" },
    { name: "Memórias em par", sprite: "coracao", copy: "Encontre os pares de Corinthians, girassol, lírio e coração. Tem um bilhete te esperando!", action: "Virar as cartas" }
  ];
  // As coordenadas são porcentagens da cena, para funcionar no celular e no computador.
  const plants = [
    { type: "flor", x: 16, y: 80 }, { type: "lirio", x: 81, y: 87 },
    { type: "flor", x: 37, y: 66 }, { type: "lirio", x: 69, y: 64 }, { type: "flor", x: 28, y: 93 }
  ];
  const saveKey = "jardim-isabelly.aventura.v1";
  const modal = $("modal");
  const bag = new Set();
  let finished = 0;
  let harvesting = false;
  let soundOn = false;
  let audioPending = false;

  try {
    const saved = JSON.parse(localStorage.getItem(saveKey));
    if (saved && Number.isInteger(saved.finished) && saved.finished >= 0 && saved.finished <= 3) {
      finished = saved.finished;
      if (!finished && Array.isArray(saved.bag)) {
        saved.bag.filter((i) => Number.isInteger(i) && i >= 0 && i < plants.length).forEach((i) => bag.add(i));
        if (bag.size === plants.length) finished = 1;
        harvesting = bag.size > 0 && finished === 0;
      }
    }
  } catch { /* O jardim também funciona quando o navegador bloqueia o armazenamento. */ }

  function save() {
    try { localStorage.setItem(saveKey, JSON.stringify({finished, bag: [...bag]})); } catch {}
  }

  function status(message) {
    $("system-status").textContent = message;
  }

  function drawInventory() {
    if (finished === 0) {
      const chip = (type, label, total) => {
        const count = [...bag].filter((i) => plants[i].type === type).length;
        return `<span class="collect-chip ${count === total ? "complete" : ""}" aria-label="${count} de ${total} ${label}">${icon(type)}<b>${count}/${total}</b></span>`;
      };
      $("inventory").innerHTML = chip("flor", "girassóis", 3) + chip("lirio", "lírios", 2);
    } else {
      const motif = finished === 3 ? "coracao" : chapters[finished].sprite;
      const label = ["", "4 partes para colorir", `${window.Capitulos.totalPares} pares para encontrar`, "Presente desbloqueado"][finished];
      $("inventory").innerHTML = `<span class="mini-note">${icon(motif)} ${label}</span>`;
    }
  }

  function drawCards() {
    $("cards").innerHTML = chapters.map((chapter, i) => {
      const done = i < finished, available = i === finished;
      const state = done ? "Concluído" : available ? "Disponível" : "Bloqueado";
      const badge = done ? "✓ " : available ? "" : icon("tranca");
      return `<button type="button" class="card" data-chapter="${i}" ${available ? 'aria-current="step"' : ""} aria-label="Capítulo ${i+1}, ${chapter.name}, ${state}">
        <span class="tile">${icon(chapter.sprite)}</span>
        <span class="card-desc"><small>CAPÍTULO 0${i+1}</small><strong>${chapter.name}</strong>
          <span class="card-state ${done ? "done" : available ? "open" : ""}">${badge}${state}</span></span>
        <span class="card-arrow" aria-hidden="true">›</span></button>`;
    }).join("");
    $("progress").textContent = `${finished}/3 CONCLUÍDOS`;
  }

  function drawConsole() {
    const chapter = chapters[finished];
    $("mission-kicker").textContent = chapter ? `MISSÃO 0${finished+1}` : "MISSÃO CUMPRIDA";
    $("mission-title").textContent = chapter ? chapter.name : "Seu bilhete";
    $("mission-copy").textContent = !finished && harvesting ? "Toque nas flores que brilham pelo campo. Cada uma vai direto para o seu buquê." :
      chapter ? chapter.copy : "O jardim está florido e o cartão tem as suas cores. Falta só abrir o envelope.";
    $("start").querySelector("span").textContent = !finished && harvesting ? "Como colher" : chapter ? chapter.action : "Ler o bilhete";
    $("start").querySelector("use").setAttribute("href", finished === 3 ? "#envelope" : "#play");
    [...$("mission-stat").children].forEach((node, i) => node.classList.toggle("on", i <= finished));
    const xp = finished ? finished * 50 : bag.size * 10;
    $("xp-label").textContent = `${xp} XP`;
    document.querySelectorAll(".xp-bars i").forEach((node, i) => node.classList.toggle("on", i < Math.round(xp / 15)));
    drawInventory();
    drawCards();
  }

  function drawFlowers() {
    $("flowers").replaceChildren();
    if (!harvesting || finished) return;
    plants.forEach((plant, i) => {
      if (bag.has(i)) return;
      const flower = document.createElement("button");
      flower.type = "button";
      flower.className = "pick";
      flower.style.left = `${plant.x}%`;
      flower.style.top = `${plant.y}%`;
      flower.setAttribute("aria-label", `Colher ${plant.type === "flor" ? "girassol" : "lírio"}`);
      flower.innerHTML = icon(plant.type);
      flower.addEventListener("click", (event) => {
        const keyboard = event.detail === 0;
        if (bag.has(i)) return;
        bag.add(i);
        const traveler = document.querySelector(".traveler");
        traveler.style.left = `${plant.x}%`;
        traveler.style.top = `${Math.min(94,plant.y+4)}%`;
        save();
        if (bag.size === plants.length) {
          harvesting = false;
          complete(0);
          showHarvestWin();
        } else {
          drawConsole();
          drawFlowers();
          status(`Flor colhida! ${bag.size} de 5 no buquê.`);
          if (keyboard) $("flowers").querySelector("button")?.focus({ preventScroll: true });
        }
      });
      $("flowers").appendChild(flower);
    });
  }

  function complete(index) {
    finished = Math.max(finished, index + 1);
    save();
    drawConsole();
    drawFlowers();
    status(finished === 3 ? "Jornada completa!" : `Capítulo 0${finished+1} disponível`);
  }

  function showDialog(kicker, title, app = "jardim.exe") {
    $("dialog-kicker").textContent = kicker;
    $("dialog-title").textContent = title;
    $("dialog-app").textContent = app;
    $("dialog-content").replaceChildren();
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    modal.querySelector(".close-modal").focus({preventScroll:true});
    return $("dialog-content");
  }

  function appendAction(container, label, callback) {
    const button = document.createElement("button");
    button.className = "action";
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", callback, {once:true});
    container.appendChild(button);
  }

  function showHarvestWin() {
    const box = showDialog("CAPÍTULO 01 COMPLETO", "Buquê colhido!");
    box.innerHTML = '<div class="win-flowers" aria-hidden="true">' + icon("flor")+icon("lirio")+icon("flor")+'</div><p>Três girassóis, dois lírios e uma tela em branco. Que cores você vai escolher para o seu buquê?</p>';
    appendAction(box, "Ir para o ateliê", () => launch(1));
  }

  function showLetter() {
    const box = showDialog("PRESENTE DESBLOQUEADO", "Para Isabelly", "bilhete.txt");
    box.innerHTML = `<article class="keepsake">
      <p>Isabelly,</p>
      <p>Se eu pudesse deixar uma coisa no meio dos seus cadernos, seria um girassol com um bilhetinho dobrado. Como ele não ia caber quando você fechasse a capa, fiz este jardim.</p>
      <p>Quando chegar o dia da prova, vou estar torcendo pela sua vaga na faculdade. Até lá, espero que sobre uma tarde pra gente ouvir uma MPB baixinha enquanto você me ensina a pintar um lírio.</p>
      <p class="sign">Com carinho, de quem gosta de você ♥</p></article>`;
    appendAction(box, "Voltar ao jardim", () => modal.close());
    const replay = document.createElement("button");
    replay.type = "button";
    replay.className = "replay";
    replay.textContent = "Jogar desde o início";
    replay.addEventListener("click", () => {
      finished = 0;
      bag.clear();
      harvesting = false;
      save();
      modal.close();
      drawConsole();
      drawFlowers();
      document.querySelector(".traveler").removeAttribute("style");
      status("Pronto para jogar");
      $("start").focus();
    });
    box.appendChild(replay);
  }

  function launch(index) {
    if (index > finished) {
      const box = showDialog(`CAPÍTULO 0${index+1}`, chapters[index].name);
      box.innerHTML = `<p>Este capítulo abre quando você terminar <strong>${chapters[index-1].name}</strong>.</p>`;
      appendAction(box, "Continuar minha jornada", () => { modal.close(); launch(finished); });
      return;
    }
    if (index === 3) return showLetter();
    if (index === 0) {
      if (finished) return showHarvestWin();
      if (harvesting) {
        const box = showDialog("CONTROLES", "Como colher");
        box.innerHTML = "<p>Toque ou clique em cada flor que brilha no campo. Pelo teclado, use Tab para escolher a flor e Enter para colher.</p>";
        appendAction(box, "Voltar ao campo", () => {modal.close(); $("flowers").querySelector("button")?.focus();});
      } else {
        harvesting = true;
        drawConsole();
        drawFlowers();
        status("Encontre as 5 flores que brilham");
        $("flowers").querySelector("button")?.focus({ preventScroll:true });
      }
      $("jogo").scrollIntoView({block:"nearest"});
      return;
    }
    const chapter = chapters[index];
    const box = showDialog(`CAPÍTULO 0${index+1}`, chapter.name, index === 1 ? "atelie.exe" : "memoria.exe");
    if (index === 1) {
      window.Capitulos.pintura(box, () => {
        complete(1);
        if (finished < 3) launch(2);
        else modal.close();
      });
    } else {
      window.Capitulos.cinema(box, () => { complete(2); showLetter(); });
    }
  }

  $("sound").addEventListener("click", async () => {
    if (audioPending) return;
    audioPending = true;
    try {
      if (soundOn) {window.Trilha.parar(); soundOn = false;}
      else soundOn = await window.Trilha.iniciar();
      $("sound").setAttribute("aria-pressed", String(soundOn));
      $("sound").classList.toggle("on", soundOn);
      $("sound").querySelector("span").textContent = soundOn ? "Som ligado" : "Som desligado";
    } finally { audioPending = false; }
  });
  $("start").addEventListener("click", () => launch(finished));
  $("cards").addEventListener("click", (e) => {
    const button = e.target.closest("[data-chapter]");
    if (button) launch(Number(button.dataset.chapter));
  });
  modal.querySelector(".close-modal").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    const rect = modal.getBoundingClientRect();
    if (e.target === modal && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) modal.close();
  });
  drawConsole();
  drawFlowers();
  if (finished) status(finished === 3 ? "Jornada completa!" : "Progresso recuperado");
  else if (harvesting) status(`${bag.size} de 5 flores no buquê`);
})();
