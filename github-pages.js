(() => {
  const root = document.documentElement;
  const storedTheme = localStorage.getItem("judoseong-theme");
  const preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
  let theme = storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : preferredTheme;

  function applyTheme(nextTheme) {
    theme = nextTheme;
    root.dataset.theme = theme;
    localStorage.setItem("judoseong-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      const nextLabel = theme === "dark" ? "LIGHT" : "DARK";
      button.textContent = nextLabel;
      button.setAttribute(
        "aria-label",
        theme === "dark" ? "라이트 테마로 바꾸기" : "다크 테마로 바꾸기",
      );
    });
  }

  applyTheme(theme);
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(theme === "dark" ? "light" : "dark");
    });
  });

  const menuButton = document.querySelector(".menu-toggle");
  const mobileNavigation = document.getElementById("mobile-navigation");
  if (menuButton && mobileNavigation) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.textContent = open ? "CLOSE" : "MENU";
      mobileNavigation.hidden = !open;
    });
  }

  const revealElements = Array.from(document.querySelectorAll(".reveal"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    revealElements.forEach((element) => revealObserver.observe(element));
  }

  document.querySelectorAll("[data-random-case-cards]").forEach((container) => {
    const cards = Array.from(container.querySelectorAll(".case-card"));
    const order = cards.map((_, index) => index);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [order[index], order[randomIndex]] = [order[randomIndex], order[index]];
    }

    const requestedCount = Number(container.dataset.visibleCount ?? 2);
    const visibleCount = Math.max(1, Math.min(requestedCount, cards.length));
    const selected = new Map(
      order.slice(0, visibleCount).map((cardIndex, rank) => [cardIndex, rank]),
    );
    cards.forEach((card, cardIndex) => {
      const rank = selected.get(cardIndex);
      card.hidden = rank === undefined;
      if (rank !== undefined) card.dataset.revealOrder = String(rank + 1);
    });
    container.dataset.randomized = "true";
  });

  const heroVideo = document.querySelector(".hero-video");
  const heroVideoToggle = document.querySelector(".hero-video-toggle");
  const heroReelIndex = document.querySelector(".hero-reel-index");
  const firstHeroSource = heroVideo?.querySelector("source")?.src;
  const heroPlaylist = firstHeroSource
    ? [
        firstHeroSource,
        new URL("hero-agency-dialogue.mp4", firstHeroSource).href,
        new URL("hero-agency-reflection.mp4", firstHeroSource).href,
      ]
    : [];
  let heroClipIndex = 0;
  let heroPlayRequested = true;

  function syncHeroVideoLabel() {
    if (!heroVideo || !heroVideoToggle) return;
    heroVideoToggle.textContent = heroVideo.paused ? "영상 재생하기" : "영상 멈추기";
    if (heroReelIndex) {
      heroReelIndex.textContent = String(heroClipIndex + 1).padStart(2, "0") + " / 03";
    }
  }

  function applyHeroMotionPreference() {
    if (!heroVideo) return;
    if (reducedMotion.matches) heroVideo.pause();
    else if (heroPlayRequested) heroVideo.play().catch(syncHeroVideoLabel);
    syncHeroVideoLabel();
  }

  if (heroVideo && heroVideoToggle) {
    heroVideo.addEventListener("play", syncHeroVideoLabel);
    heroVideo.addEventListener("pause", syncHeroVideoLabel);
    heroVideo.addEventListener("ended", () => {
      heroClipIndex = (heroClipIndex + 1) % heroPlaylist.length;
      heroVideo.src = heroPlaylist[heroClipIndex];
      heroVideo.load();
      if (!reducedMotion.matches && heroPlayRequested) {
        heroVideo.play().catch(syncHeroVideoLabel);
      }
      syncHeroVideoLabel();
    });
    heroVideoToggle.addEventListener("click", () => {
      if (heroVideo.paused) {
        heroPlayRequested = true;
        heroVideo.play().catch(syncHeroVideoLabel);
      } else {
        heroPlayRequested = false;
        heroVideo.pause();
      }
    });
    reducedMotion.addEventListener("change", applyHeroMotionPreference);
    applyHeroMotionPreference();
  }

  const track = new URLSearchParams(window.location.search).get("track");
  const trackLabels = {
    student: "학생 주도성",
    teacher: "교사 주도성",
    co: "공동 주도성",
  };
  const selectedLabel = trackLabels[track];
  if (document.querySelector(".filter-nav")) {
    document.querySelectorAll(".content-list-item").forEach((item) => {
      const tag = item.querySelector(".tag")?.textContent?.trim();
      item.hidden = Boolean(selectedLabel && tag !== selectedLabel);
    });
    document.querySelectorAll(".filter-nav a").forEach((link) => {
      const linkTrack = new URL(link.href).searchParams.get("track");
      const current = selectedLabel ? linkTrack === track : !linkTrack;
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  const agencyCheckForm = document.querySelector("[data-agency-check-form]");
  const agencyCheckResult = document.querySelector("[data-agency-check-result]");
  const agencyCheckStatus = document.querySelector("[data-agency-check-status]");

  function agencyInterpretation(score) {
    if (score <= 2) return "먼저 해당 장면이 실제로 나타나는지 관찰합니다.";
    if (score <= 5) return "나타난 장면이 반복되는 조건을 짧게 기록합니다.";
    return "현재 조건이 다른 수업에서도 유지되는지 검토합니다.";
  }

  if (agencyCheckForm && agencyCheckResult && agencyCheckStatus) {
    agencyCheckForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const questions = [...agencyCheckForm.querySelectorAll("[data-agency-question]")];
      const unanswered = questions.find((question) => !question.querySelector("input:checked"));
      if (unanswered) {
        agencyCheckResult.hidden = true;
        agencyCheckStatus.textContent = "모든 문항에 응답하면 관찰할 지점을 정리합니다.";
        unanswered.querySelector("input")?.focus();
        return;
      }

      const scores = { student: 0, teacher: 0, co: 0 };
      questions.forEach((question) => {
        const track = question.dataset.track;
        const value = Number(question.querySelector("input:checked")?.value ?? 0);
        scores[track] += value;
      });

      Object.entries(scores).forEach(([track, score]) => {
        const scoreElement = agencyCheckResult.querySelector('[data-result-score="' + track + '"]');
        const barElement = agencyCheckResult.querySelector('[data-result-bar="' + track + '"]');
        const copyElement = agencyCheckResult.querySelector('[data-result-copy="' + track + '"]');
        if (scoreElement) scoreElement.textContent = String(score);
        if (barElement) barElement.style.width = ((score / 8) * 100) + "%";
        if (copyElement) copyElement.textContent = agencyInterpretation(score);
      });

      const minimum = Math.min(scores.student, scores.teacher, scores.co);
      const lowest = Object.keys(scores).filter((track) => scores[track] === minimum);
      let nextObservation = "두 영역 이상이 비슷하게 나타납니다. 가장 최근 수업 장면부터 하나를 골라 반복 여부를 기록합니다.";
      if (lowest.length === 1 && lowest[0] === "student") {
        nextObservation = "다음 관찰에서는 학생이 목표를 다시 말하고 계획을 바꾸는 순간을 기록합니다.";
      } else if (lowest.length === 1 && lowest[0] === "teacher") {
        nextObservation = "다음 관찰에서는 교사가 판단할 수 있었던 권한·시간·동료 조건을 기록합니다.";
      } else if (lowest.length === 1 && lowest[0] === "co") {
        nextObservation = "다음 관찰에서는 규칙과 의사결정을 함께 조정한 장면을 기록합니다.";
      }

      const nextElement = agencyCheckResult.querySelector("[data-agency-next-observation]");
      if (nextElement) nextElement.textContent = nextObservation;
      agencyCheckResult.hidden = false;
      agencyCheckStatus.textContent = "점검 결과를 정리했습니다.";
      agencyCheckResult.focus();
    });

    agencyCheckForm.querySelector("[data-agency-reset]")?.addEventListener("click", () => {
      agencyCheckForm.reset();
      agencyCheckResult.hidden = true;
      agencyCheckStatus.textContent = "점검 내용을 지웠습니다.";
    });
  }

  const form = document.querySelector(".contact-form");
  if (!form) return;

  const messages = {
    name: "이름이 비어 있습니다. 성과 이름을 입력합니다.",
    organization: "소속이 비어 있습니다. 학교 또는 기관 이름을 입력합니다.",
    email: "이메일이 비어 있습니다. 예: name@school.kr",
    type: "문의 유형을 선택하지 않았습니다. 가장 가까운 항목을 선택합니다.",
    message: "문의 내용이 비어 있습니다. 필요한 프로그램과 상황을 적습니다.",
    consent: "개인정보 수집에 동의하지 않았습니다. 내용을 확인한 뒤 선택합니다.",
  };

  function validationMessage(field) {
    if (field.name === "consent") return field.checked ? "" : messages.consent;
    const value = field.value.trim();
    if (!value) return messages[field.name] ?? "입력 내용을 확인합니다.";
    if (field.name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "주소에 도메인이 빠졌습니다. 예: name@school.kr";
    }
    return "";
  }

  function showError(field, message) {
    const container = field.closest(".field");
    if (!container) return;
    container.querySelector(".static-field-error")?.remove();
    field.setAttribute("aria-invalid", String(Boolean(message)));
    if (!message) return;
    const error = document.createElement("p");
    error.className = "field-error static-field-error";
    error.textContent = message;
    container.append(error);
  }

  const fields = ["name", "organization", "email", "type", "message", "consent"]
    .map((name) => form.elements.namedItem(name))
    .filter(Boolean);
  fields.forEach((field) => {
    field.addEventListener("blur", () => showError(field, validationMessage(field)));
    field.addEventListener("change", () => showError(field, validationMessage(field)));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let firstInvalid = null;
    fields.forEach((field) => {
      const message = validationMessage(field);
      showError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    let status = form.querySelector(".form-status");
    if (!status) {
      status = document.createElement("p");
      status.className = "form-status";
      status.setAttribute("role", "status");
      form.querySelector(".form-actions")?.append(status);
    }
    if (firstInvalid) {
      status.textContent = "입력 내용을 확인합니다.";
      firstInvalid.focus();
      return;
    }
    status.textContent = "문의 전송 기능을 준비 중입니다. 메일 백엔드가 연결되면 이 양식에서 바로 문의할 수 있습니다.";
  });
})();
