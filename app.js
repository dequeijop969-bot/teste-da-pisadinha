'use strict';

(() => {
  const models = { gpt: ['GPT', '#10120f'], claude: ['Claude', '#17110f'], gemini: ['Gemini', '#0e121b'] };
  const prompt = document.querySelector('#prompt');
  const status = document.querySelector('#studio-status');
  const dialog = document.querySelector('#plan-dialog');
  let selectedModel = 'gpt';
  let project = null;

  function setModel(model, announce = true) {
    if (!Object.prototype.hasOwnProperty.call(models, model)) return;
    selectedModel = model;
    document.documentElement.dataset.model = model;
    document.querySelector('meta[name="theme-color"]').content = models[model][1];
    document.querySelector('#active-model').textContent = `${models[model][0]} / Tema demonstrativo`;
    document.querySelectorAll('input[name="model"]').forEach(input => { input.checked = input.value === model; });
    if (announce) status.textContent = `Tema ${models[model][0]} selecionado. Nenhuma IA conectada.`;
    try { localStorage.setItem('scanshield.model', model); } catch { /* Storage is optional. */ }
  }
  let savedModel = 'gpt';
  try { savedModel = localStorage.getItem('scanshield.model') || 'gpt'; } catch { /* Use default theme. */ }
  setModel(Object.prototype.hasOwnProperty.call(models, savedModel) ? savedModel : 'gpt', false);
  document.querySelectorAll('input[name="model"]').forEach(input => {
    input.addEventListener('change', () => setModel(input.value));
  });

  function updatePrompt() {
    prompt.setCustomValidity('');
    document.querySelector('#character-count').textContent = `${prompt.value.length} / ${prompt.maxLength}`;
    if (project && prompt.value.trim() !== project.idea) {
      project = null;
      document.querySelector('#project-result').hidden = true;
      document.querySelector('#preview-empty').hidden = false;
      status.textContent = 'Ideia alterada. Explore novamente para atualizar o planejamento.';
    }
  }
  prompt.addEventListener('input', updatePrompt);
  updatePrompt();
  document.querySelectorAll('[data-prompt]').forEach(button => {
    button.addEventListener('click', () => {
      prompt.value = button.dataset.prompt.slice(0, prompt.maxLength);
      updatePrompt();
      document.querySelector('#studio').scrollIntoView();
      prompt.focus({ preventScroll: true });
    });
  });

  const categories = [
    { pattern: /\b(obby|plataforma|parkour|saltos)\b/, title: 'Aventura de plataformas', concept: 'Um percurso de obstáculos com dificuldade gradual.', mechanic: 'Saltar, explorar rotas e alcançar checkpoints.', progression: 'Desbloquear novas etapas e melhorar o tempo de conclusão.' },
    { pattern: /\b(tycoon|fabrica|fabricas|economia)\b/, title: 'Construa seu império', concept: 'Um espaço que cresce com as escolhas do jogador.', mechanic: 'Coletar recursos virtuais e investir em melhorias.', progression: 'Expandir a produção e abrir novas áreas.' },
    { pattern: /\b(rpg|magico|magica|missoes|floresta)\b/, title: 'Uma jornada extraordinária', concept: 'Um mundo de exploração e descobertas.', mechanic: 'Completar missões, conversar com personagens e explorar.', progression: 'Desbloquear habilidades e novas regiões.' },
  ];
  const fallback = { title: 'Seu novo universo', concept: 'Transforme sua ideia em uma experiência com um objetivo claro.', mechanic: 'Escolha uma ação principal e teste se ela é divertida.', progression: 'Adicione desafios e recompensas ao protótipo, um passo por vez.' };
  document.querySelector('#idea-form').addEventListener('submit', event => {
    event.preventDefault();
    const idea = prompt.value.trim();
    if (!idea) {
      prompt.setCustomValidity('Descreva sua ideia antes de continuar.');
      prompt.reportValidity();
      return;
    }
    const normalized = idea.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const category = categories.find(item => item.pattern.test(normalized)) || fallback;
    project = { demo: true, source: 'Sugestões locais predefinidas; sem geração por IA', theme: selectedModel, idea, title: category.title, concept: category.concept, mechanic: category.mechanic, progression: category.progression, nextStep: 'Crie e teste um protótipo no Roblox Studio.' };
    ['title', 'concept', 'mechanic', 'progression'].forEach(key => {
      document.querySelector(`#result-${key}`).textContent = project[key];
    });
    document.querySelector('#result-prompt').textContent = idea;
    document.querySelector('#preview-empty').hidden = true;
    const result = document.querySelector('#project-result');
    result.hidden = false;
    result.tabIndex = -1;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ block: 'nearest' });
    status.textContent = 'Planejamento demonstrativo pronto. Você pode baixá-lo em JSON.';
  });
  document.querySelector('#export-button').addEventListener('click', () => {
    if (!project) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scanshield-planejamento.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const format = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function updatePrices() {
    const annual = document.querySelector('input[name="billing"]:checked').value === 'annual';
    Object.entries({ creator: 4900, studio: 12900 }).forEach(([plan, cents]) => {
      const monthly = annual ? Math.round(cents * 0.8) : cents;
      document.querySelector(`[data-price="${plan}"]`).textContent = format.format(monthly / 100);
      document.querySelector(`[data-billing-note="${plan}"]`).textContent = annual
        ? `Equivalente mensal · R$ ${format.format(monthly * 12 / 100)}/ano · ilustrativo`
        : `R$ ${format.format(monthly / 100)} por mês · plano conceitual`;
    });
  }
  document.querySelectorAll('input[name="billing"]').forEach(input => input.addEventListener('change', updatePrices));
  updatePrices();
  document.querySelectorAll('[data-plan]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelector('#dialog-title').textContent = button.dataset.plan;
      dialog.showModal();
    });
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  document.querySelector('#dialog-explore').addEventListener('click', () => {
    dialog.close();
    document.querySelector('#studio').scrollIntoView();
    prompt.focus({ preventScroll: true });
  });
})();
