document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.password-toggle').forEach(function (btn) {
    var targetId = btn.getAttribute('data-target');
    var input = document.getElementById(targetId);
    var eyeOpen = btn.querySelector('.eye-open');
    var eyeClosed = btn.querySelector('.eye-closed');

    if (!input) return;

    // Ensure input uses password masking by default
    try {
      if (input.type !== 'password' && input.type !== 'text') {
        input.type = 'password';
      }
    } catch (e) {
      // ignore
    }

    btn.addEventListener('click', function () {
      if (!input) return;
      var isPressed = btn.getAttribute('aria-pressed') === 'true';
      if (isPressed) {
        // hide value
        try { input.type = 'password'; } catch (e) {}
        btn.setAttribute('aria-pressed', 'false');
        if (eyeOpen) eyeOpen.style.display = '';
        if (eyeClosed) eyeClosed.style.display = 'none';
      } else {
        // show value
        try { input.type = 'text'; } catch (e) {}
        btn.setAttribute('aria-pressed', 'true');
        if (eyeOpen) eyeOpen.style.display = 'none';
        if (eyeClosed) eyeClosed.style.display = '';
      }
      // move focus back to input for accessibility
      try { input.focus(); } catch (e) {}
    });
  });
});
