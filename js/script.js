(function () {
  var PDF_URL = 'catalogo-MDKimport.pdf';

  // Mobile always gets the simple native browser PDF viewer — cheap,
  // just point the iframe at the file.
  var mobileFrame = document.getElementById('mobileFrame');
  if (mobileFrame) mobileFrame.src = PDF_URL + '#toolbar=1';

  // Desktop gets the page-flip book. Only build it on desktop-sized
  // screens, so mobile visitors never pay the cost of rendering 109
  // pages they won't see.
  var isDesktop = window.matchMedia('(min-width: 900px)').matches;
  if (!isDesktop) return;

  buildFlipbook();

  async function buildFlipbook() {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    var loadingEl = document.getElementById('flipbook-loading');
    var progressEl = document.getElementById('flipbook-progress');
    var stageEl = document.getElementById('book-stage');
    var controlsEl = document.getElementById('flip-controls');
    var pageIndicator = document.getElementById('pageIndicator');
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');

    var pageFrontImg = document.getElementById('pageFront');
    var pageBehindImg = document.getElementById('pageBehind');
    var panel = document.getElementById('flipPanel');
    var frontFaceEl = panel.querySelector('.flip-front');
    var backFaceEl = panel.querySelector('.flip-back');
    var frontImg = document.getElementById('flipFrontImg');
    var backImg = document.getElementById('flipBackImg');

    try {
      var pdf = await pdfjsLib.getDocument(PDF_URL).promise;
      var total = pdf.numPages;
      var singleWidth = 500; // render resolution per page, independent of on-screen size

      // Pre-render every page to its own canvas at a uniform size, then
      // compose them in pairs into "spread" images (left + right side by
      // side), so the on-screen book always shows two pages like a real
      // open book — no live two-page-spread logic that could break.
      var pageCanvases = [];
      var singleHeight = 0;

      for (var i = 1; i <= total; i++) {
        var page = await pdf.getPage(i);
        var vp1 = page.getViewport({ scale: 1 });
        var scale = singleWidth / vp1.width;
        var viewport = page.getViewport({ scale: scale });
        if (!singleHeight) singleHeight = Math.round(viewport.height);

        var canvas = document.createElement('canvas');
        canvas.width = singleWidth;
        canvas.height = singleHeight;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        pageCanvases.push(canvas);

        progressEl.textContent =
          'Chargement du catalogue… ' + Math.round((i / total) * 70) + '%';
      }

      var spreadCount = Math.ceil(total / 2);
      var spreads = [];
      var spreadLabels = [];

      for (var s = 0; s < spreadCount; s++) {
        var leftNum = 2 * s + 1;
        var rightNum = 2 * s + 2;

        var spreadCanvas = document.createElement('canvas');
        spreadCanvas.width = singleWidth * 2;
        spreadCanvas.height = singleHeight;
        var sctx = spreadCanvas.getContext('2d');
        sctx.fillStyle = '#fff';
        sctx.fillRect(0, 0, spreadCanvas.width, spreadCanvas.height);
        sctx.drawImage(pageCanvases[leftNum - 1], 0, 0);
        if (rightNum <= total) {
          sctx.drawImage(pageCanvases[rightNum - 1], singleWidth, 0);
        }

        spreads.push(spreadCanvas.toDataURL('image/jpeg', 0.78));
        spreadLabels.push(rightNum <= total ? (leftNum + '–' + rightNum) : String(leftNum));

        progressEl.textContent =
          'Chargement du catalogue… ' + (70 + Math.round(((s + 1) / spreadCount) * 30)) + '%';
      }

      // free the per-page canvases, we only need the spreads from here on
      pageCanvases.length = 0;

      loadingEl.style.display = 'none';
      stageEl.style.display = 'block';
      controlsEl.style.display = 'flex';

      var currentIndex = 0;
      var animating = false;

      pageFrontImg.src = spreads[0];
      pageBehindImg.src = spreads[0];

      function updateIndicator() {
        pageIndicator.textContent = spreadLabels[currentIndex] + ' / ' + total;
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= spreadCount - 1;
      }
      updateIndicator();

      // Hand-built page flip (no external library): a thin 3D panel with a
      // front and back face rotates around the right (next) or left (prev)
      // edge, revealing the next/previous spread underneath.
      function flip(direction) {
        if (animating) return;
        var targetIndex = currentIndex + direction;
        if (targetIndex < 0 || targetIndex >= spreadCount) return;
        animating = true;

        panel.style.transformOrigin = direction === 1 ? '100% 50%' : '0% 50%';
        frontFaceEl.style.transform = 'rotateY(0deg)';
        backFaceEl.style.transform = direction === 1 ? 'rotateY(180deg)' : 'rotateY(-180deg)';

        frontImg.src = spreads[currentIndex];
        backImg.src = spreads[targetIndex];
        pageBehindImg.src = spreads[targetIndex];

        panel.style.transition = 'none';
        panel.style.transform = 'rotateY(0deg)';
        // force reflow so the browser applies the reset before animating
        void panel.offsetWidth;
        panel.style.transition = 'transform 0.7s cubic-bezier(0.45,0,0.2,1)';

        requestAnimationFrame(function () {
          panel.style.transform = direction === 1 ? 'rotateY(-180deg)' : 'rotateY(180deg)';
        });

        panel.addEventListener('transitionend', function onEnd() {
          panel.removeEventListener('transitionend', onEnd);
          currentIndex = targetIndex;
          pageFrontImg.src = spreads[currentIndex];
          panel.style.transition = 'none';
          panel.style.transform = 'rotateY(0deg)';
          animating = false;
          updateIndicator();
        });
      }

      prevBtn.addEventListener('click', function () { flip(-1); });
      nextBtn.addEventListener('click', function () { flip(1); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') flip(1);
        if (e.key === 'ArrowLeft') flip(-1);
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