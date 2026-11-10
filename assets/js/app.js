(function () {
  'use strict';

  var root = document.documentElement;
  var themeKey = 'mk08-theme';
  var themeButton = document.querySelector('[data-theme-toggle]');
  var themeLabel = document.querySelector('[data-theme-label]');

  function currentTheme() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function syncThemeButton() {
    if (!themeButton) return;
    var dark = currentTheme() === 'dark';
    themeButton.setAttribute('aria-pressed', String(dark));
    if (themeLabel) themeLabel.textContent = dark ? 'Mode terang' : 'Mode gelap';
  }

  if (themeButton) {
    syncThemeButton();
    themeButton.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem(themeKey, next);
      } catch (error) {
        // Penyimpanan bisa diblokir; tema tetap berubah untuk sesi ini.
      }
      syncThemeButton();
    });

    window.addEventListener('storage', function (event) {
      if (event.key === themeKey && (event.newValue === 'light' || event.newValue === 'dark')) {
        root.dataset.theme = event.newValue;
        syncThemeButton();
      }
    });
  }

  var dialog = document.querySelector('[data-palette]');

  if (dialog) {
    var input = dialog.querySelector('[data-palette-input]');
    var list = dialog.querySelector('[data-palette-list]');
    var empty = dialog.querySelector('[data-palette-empty]');
    var allItems = Array.prototype.slice.call(dialog.querySelectorAll('[data-palette-item]'));
    var visibleItems = allItems.slice();
    var activeIndex = -1;

    var setActive = function (nextIndex) {
      if (!visibleItems.length) {
        activeIndex = -1;
        if (input) input.removeAttribute('aria-activedescendant');
        return;
      }

      activeIndex = (nextIndex + visibleItems.length) % visibleItems.length;

      visibleItems.forEach(function (item, index) {
        var selected = index === activeIndex;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-selected', String(selected));
      });

      var activeItem = visibleItems[activeIndex];
      if (input) input.setAttribute('aria-activedescendant', activeItem.id);
      activeItem.scrollIntoView({ block: 'nearest' });
    };

    var filterPalette = function (query) {
      var needle = String(query || '').trim().toLowerCase();
      visibleItems = [];

      allItems.forEach(function (item) {
        var matches = !needle || (item.dataset.search || '').indexOf(needle) !== -1;
        item.hidden = !matches;
        if (matches) visibleItems.push(item);
      });

      if (empty) empty.hidden = visibleItems.length !== 0;
      if (list) list.hidden = visibleItems.length === 0;
      setActive(0);
    };

    var openPalette = function () {
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      }
      if (input) {
        input.value = '';
        filterPalette('');
      }
      window.requestAnimationFrame(function () {
        if (input) input.focus();
      });
    };

    var closePalette = function () {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
    };

    Array.prototype.forEach.call(document.querySelectorAll('[data-palette-open]'), function (button) {
      button.addEventListener('click', openPalette);
    });

    Array.prototype.forEach.call(dialog.querySelectorAll('[data-palette-close]'), function (button) {
      button.addEventListener('click', closePalette);
    });

    if (input) {
      input.addEventListener('input', function () {
        filterPalette(input.value);
      });

      input.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActive(activeIndex + 1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActive(activeIndex - 1);
        } else if (event.key === 'Enter') {
          if (activeIndex >= 0 && visibleItems[activeIndex]) {
            var link = visibleItems[activeIndex].querySelector('a');
            if (link) {
              event.preventDefault();
              link.click();
            }
          }
        }
      });
    }

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closePalette();
    });

    document.addEventListener('keydown', function (event) {
      var isField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openPalette();
      } else if (event.key === '/' && !isField && !dialog.open) {
        event.preventDefault();
        openPalette();
      }
    });

    filterPalette('');
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-project-filter]'), function (panel) {
    var search = panel.querySelector('[data-project-search]');
    var buttons = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-tag]'));
    var items = Array.prototype.slice.call(panel.querySelectorAll('[data-project-item]'));
    var count = panel.querySelector('[data-filter-count]');
    var emptyState = panel.querySelector('[data-filter-empty]');
    var activeTag = '';

    var applyFilter = function () {
      var query = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;

      items.forEach(function (item) {
        var tags = (item.dataset.tags || '').split(/\s+/).filter(Boolean);
        var matchesTag = !activeTag || tags.indexOf(activeTag) !== -1;
        var matchesQuery = !query || (item.dataset.search || '').indexOf(query) !== -1;
        var show = matchesTag && matchesQuery;

        item.hidden = !show;
        if (show) shown += 1;
      });

      if (count) count.textContent = shown + ' dari ' + items.length + ' proyek';
      if (emptyState) emptyState.hidden = shown !== 0;
    };

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeTag = button.dataset.filterTag || '';
        buttons.forEach(function (item) {
          item.setAttribute('aria-pressed', String(item === button));
        });
        applyFilter();
      });
    });

    if (search) search.addEventListener('input', applyFilter);
    applyFilter();
  });

  var randomizer = document.querySelector('[data-randomizer]');
  var randomData = document.getElementById('random-data');

  if (randomizer && randomData) {
    var choices = [];

    try {
      choices = JSON.parse(randomData.textContent);
    } catch (error) {
      choices = [];
    }

    if (choices.length) {
      var title = randomizer.querySelector('[data-random-title]');
      var description = randomizer.querySelector('[data-random-dek]');
      var meta = randomizer.querySelector('[data-random-meta]');
      var link = randomizer.querySelector('[data-random-link]');
      var again = randomizer.querySelector('[data-random-again]');
      var lastIndex = -1;

      var pick = function () {
        var index = Math.floor(Math.random() * choices.length);

        if (choices.length > 1 && index === lastIndex) index = (index + 1) % choices.length;
        lastIndex = index;

        var choice = choices[index];
        if (title) title.textContent = choice.title;
        if (description) description.textContent = choice.description;
        if (meta) meta.textContent = [choice.language, choice.status, choice.date].join(' · ');
        if (link) link.href = choice.href;
      };

      if (again) again.addEventListener('click', pick);
      pick();
    }
  }
})();
