(function () {
  var PDF_URL = 'MDKimport-Catalogo-FR.pdf';

  // Single source of truth for desktop vs. mobile: computed once here in
  // JS, then applied as a class on <body>. CSS keys visibility off this
  // same class (not off its own separate @media check) so the two can
  // never disagree and show both viewers at once.
  var isDesktop = window.matchMedia('(min-width: 900px)').matches;
  document.body.classList.add(isDesktop ? 'is-desktop' : 'is-mobile');

  if (!isDesktop) {
    // Mobile: a raw <iframe src="*.pdf"> makes several mobile browsers
    // just download the file instead of showing it. Google's viewer
    // renders PDFs as plain scrollable HTML, which works reliably
    // inline across mobile browsers without needing a native PDF plugin.
    var mobileFrame = document.getElementById('mobileFrame');
    if (mobileFrame) {
      var absoluteUrl = new URL(PDF_URL, document.baseURI).href;
      mobileFrame.src = 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(absoluteUrl);
    }
    return;
  }

  // Desktop: page-flip book, using the page-flip library in its native
  // landscape/2-page-spread mode (usePortrait:false below) — the
  // well-tested mode this library is built for.
  buildFlipbook();

  async function buildFlipbook() {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    var loadingEl = document.getElementById('flipbook-loading');
    var progressEl = document.getElementById('flipbook-progress');
    var bookEl = document.getElementById('book');
    var controlsEl = document.getElementById('flip-controls');
    var pageIndicator = document.getElementById('pageIndicator');
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');

    try {
      var pdf = await pdfjsLib.getDocument(PDF_URL).promise;
      var total = pdf.numPages;
      var targetWidth = 620; // render resolution per page, independent of on-screen size

      for (var i = 1; i <= total; i++) {
        var page = await pdf.getPage(i);
        var vp1 = page.getViewport({ scale: 1 });
        var scale = targetWidth / vp1.width;
        var viewport = page.getViewport({ scale: scale });

        var canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        var pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        var img = document.createElement('img');
        img.src = canvas.toDataURL('image/jpeg', 0.82);
        pageDiv.appendChild(img);
        bookEl.appendChild(pageDiv);

        progressEl.textContent =
          'Chargement du catalogue… ' + Math.round((i / total) * 100) + '%';
      }

      loadingEl.style.display = 'none';
      controlsEl.style.display = 'flex';

      var pageFlip = new St.PageFlip(bookEl, {
        width: 420,
        height: 594,
        size: 'stretch',
        minWidth: 320,
        maxWidth: 520,
        minHeight: 452,
        maxHeight: 734,
        showCover: false,
        usePortrait: false, // always 2-page landscape spread, never the buggy single-page mode
        mobileScrollSupport: false,
        maxShadowOpacity: 0.4,
        drawShadow: true
      });
      pageFlip.loadFromHTML(document.querySelectorAll('#book .page'));

      function updateIndicator() {
        var current = pageFlip.getCurrentPageIndex();
        var left = current + 1;
        var right = Math.min(left + 1, total);
        pageIndicator.textContent = (left === right ? String(left) : left + '–' + right) + ' / ' + total;
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current >= total - 1;
      }
      pageFlip.on('flip', updateIndicator);
      updateIndicator();

      prevBtn.addEventListener('click', function () { pageFlip.flipPrev(); });
      nextBtn.addEventListener('click', function () { pageFlip.flipNext(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') pageFlip.flipNext();
        if (e.key === 'ArrowLeft') pageFlip.flipPrev();
      });
    } catch (err) {
      console.error(err);
      loadingEl.innerHTML =
        '<p style="padding:20px;font-size:14px;text-align:center;">Aperçu indisponible pour le moment. <a href="' +
        PDF_URL +
        '">Ouvrez le catalogue directement</a>.</p>';
    }
  }
})();