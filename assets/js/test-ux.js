(function () {
  // 기존 공개본의 선택/우클릭 차단 이벤트보다 먼저 처리해 기본 브라우저 기능을 복원한다.
  document.addEventListener("selectstart", (event) => event.stopImmediatePropagation(), true);
  document.addEventListener("contextmenu", (event) => event.stopImmediatePropagation(), true);

  const progress = document.createElement("div");
  progress.className = "reading-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = '<span class="reading-progress__bar"></span>';
  document.body.appendChild(progress);

  const progressBar = progress.querySelector(".reading-progress__bar");
  let progressFrame = 0;

  function updateProgress() {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.min(1, Math.max(0, window.scrollY / scrollable));
    progressBar.style.width = `${value * 100}%`;
    progressFrame = 0;
  }

  window.addEventListener("scroll", () => {
    if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();

  // 프롬프트 미리보기 문장을 명시적인 두 번째 그리드 열에 넣어
  // 글머리표와 문장 시작선이 브라우저별로 흔들리지 않게 한다.
  document.querySelectorAll("#thumbnail .prompt-preview:not(.quick-preview) p, #handwriting .prompt-preview:not(.quick-preview) p").forEach((paragraph) => {
    if (paragraph.querySelector(":scope > .prompt-preview__text")) return;

    const text = document.createElement("span");
    text.className = "prompt-preview__text";
    while (paragraph.firstChild) text.appendChild(paragraph.firstChild);
    paragraph.appendChild(text);
  });

  // 배너 메타 정보는 장식 세로선이 아니라 제목/설명과 동일한 본문 축에 배치한다.
  const modelsContent = document.querySelector("#models .level-banner-inner > div:first-child");
  if (modelsContent && !modelsContent.querySelector(".model-info-date")) {
    const date = document.createElement("span");
    date.className = "banner-meta model-info-date";
    date.textContent = "모델 정보 확인 기준 · 2026년 7월 발행 시점";
    modelsContent.appendChild(date);
  }

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
    rel.add("noopener");
    rel.add("noreferrer");
    link.setAttribute("rel", [...rel].join(" "));
  });
})();
