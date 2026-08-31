/**
 * Aplica o tema (claro/escuro) antes da primeira pintura para evitar flash.
 * Lê a preferência salva em localStorage; na ausência, segue o sistema.
 */
export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem('emeriq-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||((!t||t==='system')&&m);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
