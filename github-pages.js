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

  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("is-visible");
  });

  const heroVideo = document.querySelector(".hero-video");
  const heroVideoToggle = document.querySelector(".hero-video-toggle");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function syncHeroVideoLabel() {
    if (!heroVideo || !heroVideoToggle) return;
    heroVideoToggle.textContent = heroVideo.paused ? "영상 재생하기" : "영상 멈추기";
  }

  function applyHeroMotionPreference() {
    if (!heroVideo) return;
    if (reducedMotion.matches) heroVideo.pause();
    else heroVideo.play().catch(syncHeroVideoLabel);
    syncHeroVideoLabel();
  }

  if (heroVideo && heroVideoToggle) {
    heroVideo.addEventListener("play", syncHeroVideoLabel);
    heroVideo.addEventListener("pause", syncHeroVideoLabel);
    heroVideoToggle.addEventListener("click", () => {
      if (heroVideo.paused) heroVideo.play().catch(syncHeroVideoLabel);
      else heroVideo.pause();
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
