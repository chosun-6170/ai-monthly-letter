(function () {
  const script = document.currentScript;
  const base = script?.dataset.base || "./";
  const pageIssueId = script?.dataset.issue || "";

  const absolutePath = (path) => `${base}${path}`;
  let printModeActive = false;
  let topbarInlineStyle = null;

  function enterPrintMode() {
    if (printModeActive) return;
    printModeActive = true;
    document.documentElement.classList.add("is-printing");

    const topbar = document.querySelector(".topbar");
    if (!topbar) return;

    topbarInlineStyle = topbar.getAttribute("style");
    topbar.style.setProperty("display", "none", "important");
    topbar.style.setProperty("visibility", "hidden", "important");
  }

  function exitPrintMode() {
    if (!printModeActive) return;
    printModeActive = false;
    document.documentElement.classList.remove("is-printing");

    const topbar = document.querySelector(".topbar");
    if (!topbar) return;

    if (topbarInlineStyle === null) topbar.removeAttribute("style");
    else topbar.setAttribute("style", topbarInlineStyle);
    topbarInlineStyle = null;
  }

  window.addEventListener("beforeprint", enterPrintMode);
  window.addEventListener("afterprint", exitPrintMode);

  const printMedia = window.matchMedia?.("print");
  printMedia?.addEventListener?.("change", (event) => {
    if (event.matches) enterPrintMode();
    else exitPrintMode();
  });

  function makeIssueItem(issue, currentId) {
    const published = issue.status === "published";
    const item = document.createElement(published ? "a" : "div");
    item.className = `issue-switcher__item${published ? "" : " is-planned"}`;

    if (published) {
      item.href = absolutePath(issue.path);
    }

    if (issue.id === currentId) {
      item.setAttribute("aria-current", "page");
    }

    const label = document.createElement("span");
    label.className = "issue-switcher__month";
    label.textContent = issue.label;

    const status = document.createElement("span");
    status.className = "issue-switcher__status";
    status.textContent = issue.id === currentId ? "현재 보는 호" : published ? "발행" : "예정";

    item.append(label, status);
    return item;
  }

  function makePagerItem(issue, role, currentId) {
    if (!issue) {
      const empty = document.createElement("div");
      empty.className = "issue-pager__item is-empty";
      empty.innerHTML = `<span class="issue-pager__eyebrow">${role}</span><span class="issue-pager__label">해당 호 없음</span>`;
      return empty;
    }

    const published = issue.status === "published";
    const item = document.createElement(published ? "a" : "div");
    item.className = [
      "issue-pager__item",
      issue.id === currentId ? "is-current" : "",
      published ? "" : "is-planned"
    ].filter(Boolean).join(" ");

    if (published) {
      item.href = absolutePath(issue.path);
    }

    const statusLabel = published ? issue.volume : "준비 중";
    item.innerHTML = `<span class="issue-pager__eyebrow">${role} · ${statusLabel}</span><span class="issue-pager__label">${issue.label}</span>`;
    return item;
  }

  function embedPrintThumbnailImages(sourceGrid, targetGrid) {
    const sourceImages = Array.from(sourceGrid.querySelectorAll(".hero-thumb img"));
    const targetImages = Array.from(targetGrid.querySelectorAll(".hero-thumb img"));

    sourceImages.forEach((sourceImage, index) => {
      const targetImage = targetImages[index];
      if (!targetImage) return;

      const embed = () => {
        if (!sourceImage.naturalWidth || !sourceImage.naturalHeight) return;

        try {
          const maxWidth = 1400;
          const scale = Math.min(1, maxWidth / sourceImage.naturalWidth);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(sourceImage.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(sourceImage.naturalHeight * scale));

          const context = canvas.getContext("2d");
          if (!context) return;

          context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
          targetImage.src = canvas.toDataURL("image/jpeg", 0.92);
          targetImage.removeAttribute("srcset");
          targetImage.removeAttribute("loading");
          targetImage.removeAttribute("decoding");
        } catch (error) {
          targetImage.src = sourceImage.currentSrc || sourceImage.src;
        }
      };

      if (sourceImage.complete) embed();
      else sourceImage.addEventListener("load", embed, { once: true });
    });
  }

  function renderPrintLayout(currentIssue) {
    if (document.querySelector(".print-document")) return;

    const main = document.querySelector("main");
    const hero = document.querySelector(".hero");
    const thumbGrid = document.querySelector(".hero .thumb-grid");
    const footer = document.querySelector(".level-footer");
    if (!main || !hero || !thumbGrid) return;

    const title = document.querySelector(".brand")?.textContent?.trim() || document.title;

    const printDocument = document.createElement("div");
    printDocument.className = "print-document";
    printDocument.setAttribute("aria-hidden", "true");

    const cover = document.createElement("section");
    cover.className = "print-cover-page";

    const header = document.createElement("header");
    header.className = "print-report-header";

    const organization = document.createElement("p");
    organization.className = "print-report-organization";
    organization.textContent = "조선대학교 디지털교육지원팀 통합 AI 플랫폼 월간 레터";

    const titleElement = document.createElement("h1");
    titleElement.className = "print-report-title";
    titleElement.textContent = title;

    const issue = document.createElement("p");
    issue.className = "print-report-issue";
    issue.textContent = `${currentIssue.label} · ${currentIssue.volume}`;

    header.append(organization, titleElement, issue);

    const coverContent = document.createElement("div");
    coverContent.className = "print-cover-content";
    const printThumbGrid = thumbGrid.cloneNode(true);
    embedPrintThumbnailImages(thumbGrid, printThumbGrid);
    coverContent.appendChild(printThumbGrid);

    const tools = document.createElement("div");
    tools.className = "print-cover-tools";

    const printNav = document.createElement("nav");
    printNav.className = "print-section-nav";
    printNav.setAttribute("aria-label", "인쇄용 목차");

    document.querySelectorAll(".section-jump-nav a").forEach((link) => {
      const item = document.createElement("a");
      item.href = link.getAttribute("href") || "#";
      item.textContent = link.textContent.trim();
      printNav.appendChild(item);
    });

    const platform = document.createElement("a");
    platform.className = "print-platform-link";
    platform.href = "https://chosun.factchat.bot/auth";
    platform.innerHTML = "<strong>AI 플랫폼 바로가기 ↗</strong><span>chosun.factchat.bot/auth</span>";

    tools.append(printNav, platform);
    coverContent.appendChild(tools);

    const notice = hero.querySelector(".prompt-notice-bar");
    if (notice) {
      const noticeClone = notice.cloneNode(true);
      noticeClone.setAttribute("open", "");
      noticeClone.classList.add("is-readable", "is-print-expanded");
      coverContent.appendChild(noticeClone);
    }

    cover.append(header, coverContent);

    const reportTable = document.createElement("table");
    reportTable.className = "print-report-pages";

    const tableHead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const headCell = document.createElement("td");
    const runningHeader = document.createElement("div");
    runningHeader.className = "print-running-header";

    const runningTitle = document.createElement("span");
    runningTitle.textContent = "조선대학교 디지털교육지원팀 통합 AI 플랫폼 월간 레터";

    const runningIssue = document.createElement("strong");
    runningIssue.textContent = `${currentIssue.label} · ${currentIssue.volume}`;

    runningHeader.append(runningTitle, runningIssue);
    headCell.appendChild(runningHeader);
    headRow.appendChild(headCell);
    tableHead.appendChild(headRow);

    const tableBody = document.createElement("tbody");
    const bodyRow = document.createElement("tr");
    const bodyCell = document.createElement("td");
    const reportContent = document.createElement("div");
    reportContent.className = "print-report-content";

    main.querySelectorAll(":scope > .detail-section, :scope > .quick-section").forEach((section) => {
      reportContent.appendChild(section.cloneNode(true));
    });

    if (footer) reportContent.appendChild(footer.cloneNode(true));

    bodyCell.appendChild(reportContent);
    bodyRow.appendChild(bodyCell);
    tableBody.appendChild(bodyRow);
    reportTable.append(tableHead, tableBody);

    printDocument.append(cover, reportTable);
    document.body.appendChild(printDocument);
  }

  function renderNavigation(data) {
    const issues = Array.isArray(data.issues) ? data.issues : [];
    const currentId = pageIssueId || data.currentIssue;
    const currentIndex = Math.max(0, issues.findIndex((issue) => issue.id === currentId));
    const currentIssue = issues[currentIndex];
    const topbarInner = document.querySelector(".topbar-inner") || document.querySelector(".topbar");

    if (!currentIssue || !topbarInner) return;

    document.querySelectorAll("#thumbnail .prompt-preview:not(.quick-preview) p, #handwriting .prompt-preview:not(.quick-preview) p").forEach((paragraph) => {
      if (paragraph.querySelector(":scope > .prompt-preview__text")) return;

      const text = document.createElement("span");
      text.className = "prompt-preview__text";
      while (paragraph.firstChild) text.appendChild(paragraph.firstChild);
      paragraph.appendChild(text);
    });

    const modelsContent = document.querySelector("#models .level-banner-inner > div:first-child");
    if (modelsContent && !modelsContent.querySelector(".model-info-date")) {
      const date = document.createElement("span");
      date.className = "banner-meta model-info-date";
      date.textContent = `모델 정보 확인 기준 · ${currentIssue.year}년 ${currentIssue.month}월 발행 시점`;
      modelsContent.appendChild(date);
    }

    renderPrintLayout(currentIssue);

    const switcher = document.createElement("div");
    switcher.className = "issue-switcher";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "issue-switcher__button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-haspopup", "true");
    button.textContent = `${currentIssue.month}월호`;

    const panel = document.createElement("div");
    panel.className = "issue-switcher__panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "월간 레터 발행호 선택");

    const heading = document.createElement("div");
    heading.className = "issue-switcher__heading";
    heading.textContent = "2026 월간 레터";

    const list = document.createElement("div");
    list.className = "issue-switcher__list";
    issues.forEach((issue) => list.appendChild(makeIssueItem(issue, currentId)));

    panel.append(heading, list);
    switcher.append(button, panel);
    topbarInner.insertBefore(switcher, document.getElementById("themeToggle"));

    const setOpen = (open) => {
      switcher.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    };

    button.addEventListener("click", () => setOpen(!switcher.classList.contains("is-open")));
    document.addEventListener("click", (event) => {
      if (!switcher.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.focus();
      }
    });

    const pager = document.createElement("nav");
    pager.className = "issue-pager";
    pager.setAttribute("aria-label", "이전 호와 다음 호 이동");
    pager.append(
      makePagerItem(issues[currentIndex - 1], "이전 호", currentId),
      makePagerItem(currentIssue, "현재 호", currentId),
      makePagerItem(issues[currentIndex + 1], "다음 호", currentId)
    );

    const footer = document.querySelector("footer, .footer");
    if (footer) footer.before(pager);
    else document.body.appendChild(pager);
  }

  fetch(absolutePath("data/issues.json"), { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Issue data request failed: ${response.status}`);
      return response.json();
    })
    .then(renderNavigation)
    .catch((error) => console.warn("월별 탐색 메뉴를 불러오지 못했습니다.", error));
})();
