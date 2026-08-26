(async function () {
  var PDF_URL = 'catalogo-MDKimport.pdf';
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
    var targetWidth = 720; // render resolution, independent of on-screen size

    for (var i = 1; i <= total; i++) {
      var page = await pdf.getPage(i);
      var vp1 = page.getViewport({ scale: 1 });
      var scale = targetWidth / vp1.width;
      var viewport = page.getViewport({ scale: scale });

      var canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      var ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      var pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      var img = document.createElement('img');
      img.src = canvas.toDataURL('image/jpeg', 0.78);
      pageDiv.appendChild(img);
      bookEl.appendChild(pageDiv);

      progressEl.textContent =
        'Chargement du catalogue… ' + Math.round((i / total) * 100) + '%';
    }

    loadingEl.style.display = 'none';
    controlsEl.style.display = 'flex';
    pageIndicator.textContent = '1 / ' + total;

    // Fixed A4-portrait ratio (matches .viewer's aspect-ratio in CSS) and
    // a maxWidth capped below 2x minWidth, so the book can NEVER open into
    // a two-page landscape spread — this is what caused the white bars.
    var pageFlip = new St.PageFlip(bookEl, {
      width: 400,
      height: 566,
      size: 'stretch',
      minWidth: 260,
      maxWidth: 480,
      minHeight: 368,
      maxHeight: 679,
      showCover: false,
      mobileScrollSupport: false,
      maxShadowOpacity: 0.4,
      usePortrait: true
    });
    pageFlip.loadFromHTML(document.querySelectorAll('#book .page'));

    function updateIndicator() {
      var current = pageFlip.getCurrentPageIndex();
      pageIndicator.textContent = current + 1 + ' / ' + total;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current >= total - 1;
    }
    pageFlip.on('flip', updateIndicator);
    updateIndicator();

    prevBtn.addEventListener('click', function () {
      pageFlip.flipPrev();
    });
    nextBtn.addEventListener('click', function () {
      pageFlip.flipNext();
    });
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
})();
