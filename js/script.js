(async function () {
  var PDF_URL = 'MDKimport-Catalogo-FR-4.pdf';
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
    var targetWidth = 720; // render resolution, independent of on-screen size
    var pages = []; // dataURL per page, kept in memory only (not in the DOM)

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

      pages.push(canvas.toDataURL('image/jpeg', 0.78));
      progressEl.textContent =
        'Chargement du catalogue… ' + Math.round((i / total) * 100) + '%';
    }

    loadingEl.style.display = 'none';
    stageEl.style.display = 'block';
    controlsEl.style.display = 'flex';

    var currentIndex = 0;
    var animating = false;

    pageFrontImg.src = pages[0];
    pageBehindImg.src = pages[0];

    function updateIndicator() {
      pageIndicator.textContent = currentIndex + 1 + ' / ' + total;
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex >= total - 1;
    }
    updateIndicator();

    // Hand-built page flip (no external library): a thin 3D panel with a
    // front and back face rotates around the right (next) or left (prev)
    // edge. This sidesteps a known bug in third-party flipbook libraries
    // where the single-page/portrait mode fails to render the back face,
    // leaving the previous page hidden.
    function flip(direction) {
      if (animating) return;
      var targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= total) return;
      animating = true;

      panel.style.transformOrigin = direction === 1 ? '100% 50%' : '0% 50%';
      frontFaceEl.style.transform = 'rotateY(0deg)';
      backFaceEl.style.transform = direction === 1 ? 'rotateY(180deg)' : 'rotateY(-180deg)';

      frontImg.src = pages[currentIndex];
      backImg.src = pages[targetIndex];
      pageBehindImg.src = pages[targetIndex];

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
        pageFrontImg.src = pages[currentIndex];
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
})();
