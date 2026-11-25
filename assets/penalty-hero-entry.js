/* Route the standalone Penalty Hero entries to the installed game on this origin.
   The match engine and in-career training keep their own squad/state lifecycle. */
(function () {
  'use strict';
  const page = new URL(location.href);
  const entry = code => {
    const url = new URL('assets/penalties/', page);
    const room = String(code || '').toUpperCase().replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '').slice(0, 6);
    if (room) url.searchParams.set('room', room);
    return url;
  };
  if (page.searchParams.has('pen')) {
    location.replace(entry(page.searchParams.get('pen')).href);
    return;
  }
  let opening = false;
  document.addEventListener('click', async event => {
    const target = event.target.closest && event.target.closest('[data-pcup-open],[data-pcup-net],#spPens');
    if (!target || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (opening) return;
    if (typeof G !== 'undefined' && G && ((G.live && !G.live.settled) || (G.beginner && G.beginner.live))) {
      if (typeof toast === 'function') toast('סיים קודם את המשחק הפעיל');
      return;
    }
    opening = true;
    try {
      if (typeof G !== 'undefined' && G) {
        if (G.beginner && typeof Bwrite === 'function') await Bwrite();
        else if (typeof save === 'function' && !(typeof SANDBOX !== 'undefined' && SANDBOX)) await save();
      }
      location.assign(entry().href);
    } catch (error) {
      opening = false;
      console.warn('Penalty Hero: could not save before opening', error);
      if (typeof toast === 'function') toast('לא הצלחנו לשמור את הקריירה. נסה לפתוח שוב.');
    }
  }, true);
})();
