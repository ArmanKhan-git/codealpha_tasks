 const styleKeys = () => {
    document.querySelectorAll('.key').forEach(btn => {
      btn.classList.add(
        'rounded-2xl','px-4','py-3','text-lg','font-medium','bg-white/70',
        'dark:bg-slate-900/60','border','border-slate-200','dark:border-slate-700',
        'shadow-sm','active:scale-[0.98]','transition','select-none',
        'focus:outline-none','focus:ring','focus:ring-indigo-300','dark:focus:ring-indigo-800'
      );
    });
    document.querySelectorAll('.op').forEach(btn => btn.classList.add('text-indigo-600','dark:text-indigo-400'));
    const ac = document.querySelector('.key-ac');
    if (ac) ac.classList.add('text-rose-600','dark:text-rose-400');
  };
  styleKeys();

  // --- Theme toggle ---
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  function setTheme(mode){
    if(mode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('calc-theme', mode);
  }
  function initTheme(){
    const saved = localStorage.getItem('calc-theme');
    if(saved){ setTheme(saved); }
    else { setTheme(prefersDark.matches ? 'dark' : 'light'); }
  }
  initTheme();
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  });

  // --- Calculator Logic ---
  const display = document.getElementById('display');
  const historyEl = document.getElementById('history');
  const historyLine = document.getElementById('historyLine');

  let expr = '';

  function updateDisplay(){
    display.value = expr || '0';
  }

  function append(value){
    const ops = ['+','-','*','/'];
    const last = expr.slice(-1);
    if(ops.includes(value)){
      if(expr === '' && value !== '-') return;
      if(ops.includes(last)){
        expr = expr.slice(0, -1) + value;
        updateDisplay();
        return;
      }
    }
    if(value === '.'){
      const parts = expr.split(/[^0-9.]/);
      const lastNum = parts[parts.length-1] || '';
      if(lastNum.includes('.')) return;
    }
    expr += value;
    updateDisplay();
  }

  function clearAll(){ expr = ''; updateDisplay(); historyLine.textContent = ''; }
  function del(){ expr = expr.slice(0, -1); updateDisplay(); }

  function sanitizeAndTransform(input){
    if(!/^[-+*/().%\d\s]*$/.test(input)) throw new Error('Invalid characters');
    const percentReplaced = input.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    return percentReplaced
      .replace(/(\d|\))(\()/g, '$1*$2')
      .replace(/(\))(\d)/g, '$1*$2');
  }

  function evaluate(){
    if(!expr) return;
    try{
      const sanitized = sanitizeAndTransform(expr);
      const result = Function(`"use strict"; return (${sanitized})`)();
      if(result === undefined || Number.isNaN(result) || !Number.isFinite(result)) throw new Error();
      const rounded = Math.round((result + Number.EPSILON) * 1e12) / 1e12;
      historyLine.textContent = `${expr} =`;
      expr = String(rounded);
      updateDisplay();
      addToHistory(historyLine.textContent + ' ' + expr);
    } catch{
      shake();
    }
  }

  function addToHistory(line){
    const item = document.createElement('button');
    item.className = 'w-full text-left px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition';
    item.textContent = line;
    item.addEventListener('click', () => {
      const m = line.match(/=\s*(.*)$/);
      expr = m ? m[1] : '';
      updateDisplay();
    });
    historyEl.prepend(item);
  }

  document.getElementById('clearHistory').addEventListener('click', () => {
    historyEl.innerHTML = '';
  });

  function shake(){
    const card = document.querySelector('.rounded-3xl.shadow-lg');
    card.classList.add('animate-[shake_0.3s_linear_1]');
    setTimeout(()=>card.classList.remove('animate-[shake_0.3s_linear_1]'), 300);
  }

  const style = document.createElement('style');
  style.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}`;
  document.head.appendChild(style);

  // Button clicks
  document.querySelectorAll('[data-value]').forEach(btn => {
    btn.addEventListener('click', () => append(btn.getAttribute('data-value')));
  });
  document.querySelector('[data-action="clear"]').addEventListener('click', clearAll);
  document.querySelector('[data-action="delete"]').addEventListener('click', del);
  document.querySelector('[data-action="evaluate"]').addEventListener('click', evaluate);

  // Keyboard support
  window.addEventListener('keydown', (e) => {
    const { key } = e;
    if(/^[0-9]$/.test(key)) return append(key);
    if(['+','-','*','/','(',')','.'].includes(key)) return append(key);
    if(key === 'Enter' || key === '='){ e.preventDefault(); return evaluate(); }
    if(key === 'Backspace') return del();
    if(key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey)) return clearAll();
    if(key === '%') return append('%');
  });

  updateDisplay();