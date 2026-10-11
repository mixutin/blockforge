// One-time migration from the old "Blockforge" name: copy every localStorage key "blockforge.*" to "kindlr.*"
// (autosaved project, cloud link, theme, …) so nothing is lost. Old keys are left in place as a backup.
// Imported first by every entry point.
try {
  if (!localStorage.getItem('kindlr.migrated.v1')) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('blockforge.')) { const nk = 'kindlr.' + k.slice('blockforge.'.length); if (localStorage.getItem(nk) === null) localStorage.setItem(nk, localStorage.getItem(k)); }
    }
    localStorage.setItem('kindlr.migrated.v1', '1');
  }
} catch (e) { /* storage unavailable (private mode / sandbox): nothing to migrate */ }
