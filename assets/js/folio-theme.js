(function () {
  var root = document.documentElement;
  var toggle = document.querySelector(".folio-theme-toggle");
  var storedTheme = null;

  try {
    storedTheme = window.localStorage.getItem("folio-theme");
  } catch (error) {
    storedTheme = null;
  }

  if (storedTheme === "dark" || storedTheme === "light") {
    root.setAttribute("data-theme", storedTheme);
  }

  function currentTheme() {
    var explicit = root.getAttribute("data-theme");
    if (explicit) {
      return explicit;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function syncToggle() {
    if (!toggle) {
      return;
    }
    var isDark = currentTheme() === "dark";
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.innerHTML = isDark
      ? '<i class="fas fa-sun" aria-hidden="true"></i>'
      : '<i class="fas fa-moon" aria-hidden="true"></i>';
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var nextTheme = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", nextTheme);
      try {
        window.localStorage.setItem("folio-theme", nextTheme);
      } catch (error) {
      }
      syncToggle();
    });
  }

  syncToggle();
})();
