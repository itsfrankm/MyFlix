export function initProfilesPage(signal) {
  const listenerOpts = signal ? { signal } : undefined;
  const inPagesFolder = window.location.pathname.includes("/pages/");
  const assetPrefix = inPagesFolder ? "../assets/images/" : "assets/images/";

  const normalizeLegacyImg = (src) => {
    if (!src) return assetPrefix + "Convidado.jpg";
    if (/^(?:https?:\/\/[^/]+)?\/?(?:pictures|Pictures)\//.test(src)) {
      return (
        assetPrefix +
        src.replace(/^(?:https?:\/\/[^/]+)?\/?(?:pictures|Pictures)\//, "")
      );
    }
    if (src.includes("assets/images/")) {
      return assetPrefix + src.split("assets/images/")[1];
    }
    return src;
  };

  const profileNodes = Array.from(
    document.querySelectorAll(".Profiles .Profile"),
  );
  const profilesDefault = profileNodes.map((node) => {
    const img = node.querySelector("img");
    const name = node.querySelector("p")
      ? node.querySelector("p").textContent.trim()
      : "Convidado";
    return {
      name,
      img: img ? normalizeLegacyImg(img.getAttribute("src") || img.src) : assetPrefix + "Convidado.jpg",
    };
  });

  let profiles =
    JSON.parse(localStorage.getItem("perfils_v1") || "null") || profilesDefault;
  profiles = profiles.map((p) => ({ ...p, img: normalizeLegacyImg(p.img) }));

  let activeIndex = Number(localStorage.getItem("perfilAtivoIndex"));
  if (
    !Number.isInteger(activeIndex) ||
    activeIndex < 0 ||
    activeIndex >= profiles.length
  ) {
    activeIndex = profiles.findIndex((p) => p.name === "Convidado");
    if (activeIndex < 0) activeIndex = 0;
  }

  const profilesListEl = document.querySelector(".Profiles .Profiles-list");
  const profileIcon = document.querySelector(".profile-icon");
  const kidsLink = document.querySelector(".kids-link");
  const profileMenuBtn = document.querySelector(".profile-menu");
  const themeToggle = document.querySelector(".theme-toggle");
  const notifButton = document.querySelector(".nav-notification");
  const brandLink = document.querySelector(".brand");

  if (brandLink) {
    brandLink.addEventListener("click", (e) => {
      if (typeof window.__MYFLIX_NAVIGATE__ === "function") {
        e.preventDefault();
        window.__MYFLIX_NAVIGATE__("profiles");
      }
    });
  }

  function persist() {
    localStorage.setItem("perfils_v1", JSON.stringify(profiles));
    localStorage.setItem("perfilAtivoIndex", String(activeIndex));
    localStorage.setItem(
      "perfilAtivoNome",
      profiles[activeIndex] ? profiles[activeIndex].name : "Convidado",
    );
    localStorage.setItem(
      "perfilAtivoImagem",
      profiles[activeIndex]
        ? profiles[activeIndex].img
        : assetPrefix + "Convidado.jpg",
    );
  }

  function renderMainProfiles() {
    if (!profilesListEl) return;
    profilesListEl.innerHTML = "";
    profiles.forEach((p, idx) => {
      const li = document.createElement("li");
      li.className = "Profile";
      li.innerHTML = `
        <figure>
          <a href="catalogo.html" class="profile-link">
            <img src="${p.img}" alt="${p.name}" />
          </a>
          <p>${p.name}</p>
        </figure>
      `;
      const link = li.querySelector(".profile-link");
      link.addEventListener("click", (e) => {
        applyActive(idx, true);
        if (typeof window.__MYFLIX_NAVIGATE__ === "function") {
          e.preventDefault();
          window.__MYFLIX_NAVIGATE__("catalogo");
        }
      });
      profilesListEl.appendChild(li);
    });
    // Atualiza o atributo de contagem para escalar dinamicamente via CSS
    const count = profiles.length;
    profilesListEl.setAttribute("data-count", count);
    profilesListEl.classList.toggle("profiles-many", count >= 9);
    // Ajusta colunas do grid conforme quantidade via variável CSS (preserva breakpoints mobile)
    const cols =
      count <= 4 ? 4 : count <= 6 ? Math.min(count, 5) : Math.min(count, 6);
    profilesListEl.style.setProperty("--profile-cols", String(cols));
  }

  function applyActive(i, animate = true) {
    if (!profiles[i]) return;
    activeIndex = i;
    if (profileIcon) {
      profileIcon.src = profiles[i].img;
      if (animate) {
        profileIcon.classList.remove("profile-switch-anim");
        void profileIcon.offsetWidth;
        profileIcon.classList.add("profile-switch-anim");
      }
    }
    if (kidsLink) kidsLink.textContent = profiles[i].name || "Convidado";
    document
      .querySelectorAll(".Profile")
      .forEach((el, idx) => el.classList.toggle("selected", idx === i));
    persist();
  }

  function toggleProfileDropdown() {
    const existing = document.querySelector(".profiles-dropdown");
    if (existing) return existing.remove();
    const dd = document.createElement("div");
    dd.className = "profiles-dropdown";
    dd.style.position = "absolute";
    // position relative to header right area
    dd.style.right = "18px";
    dd.style.top = "60px";
    dd.style.padding = "10px";
    dd.style.borderRadius = "10px";
    dd.style.zIndex = 4500;
    dd.style.minWidth = "220px";
    dd.innerHTML = profiles
      .map(
        (p, i) => `
      <div class="profiles-dropdown-item" data-idx="${i}" style="display:flex;gap:10px;align-items:center;padding:8px;border-radius:6px;cursor:pointer">
        <img src="${p.img}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.06)" />
        <div style="flex:1">${p.name}</div>
      </div>
    `,
      )
      .join("");
    document.body.appendChild(dd);
    dd.querySelectorAll(".profiles-dropdown-item").forEach((el) => {
      el.addEventListener("click", () => {
        const i = Number(el.getAttribute("data-idx"));
        applyActive(i, true);
        dd.remove();
      });
    });
    setTimeout(() => {
      const onDoc = (e) => {
        if (!dd.contains(e.target) && e.target !== profileMenuBtn) dd.remove();
      };
      document.addEventListener(
        "click",
        onDoc,
        signal ? { once: true, signal } : { once: true },
      );
    }, 10);
  }

  if (profileMenuBtn)
    profileMenuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleProfileDropdown();
    });

  // Notifications toggle
  if (notifButton) {
    const card = notifButton.querySelector(".notification-card");
    const toggle = (open) => {
      const isOpen =
        typeof open === "boolean"
          ? open
          : notifButton.getAttribute("aria-expanded") === "true"
            ? false
            : true;
      notifButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (card) card.setAttribute("aria-hidden", isOpen ? "false" : "true");
    };
    notifButton.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });
    document.addEventListener(
      "click",
      (e) => {
        if (!notifButton.contains(e.target)) toggle(false);
      },
      listenerOpts,
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") toggle(false);
      },
      listenerOpts,
    );
  }

  // Theme toggle
  const applyTheme = (theme) => {
    if (theme === "light")
      document.documentElement.classList.add("theme-light");
    else document.documentElement.classList.remove("theme-light");
  };
  const saved = localStorage.getItem("theme");
  if (saved) applyTheme(saved);
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = document.documentElement.classList.toggle("theme-light");
      localStorage.setItem("theme", isLight ? "light" : "dark");
      themeToggle.innerHTML = isLight
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    });
    themeToggle.innerHTML = document.documentElement.classList.contains(
      "theme-light",
    )
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  }

  // Gerenciar perfis button
  const controls = document.querySelector(".profiles-controls.below-profiles");
  if (controls && !controls.querySelector(".manage-profiles-btn")) {
    const btn = document.createElement("button");
    btn.className = "manage-profiles-btn";
    btn.textContent = "Gerenciar perfis";
    btn.addEventListener("click", openProfilesModal);
    controls.appendChild(btn);
  }

  // inicial render
  renderMainProfiles();
  applyActive(activeIndex, false);

  // Modal de edição
  function openProfilesModal() {
    const overlay = document.createElement("div");
    overlay.className = "profiles-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "profiles-modal";

    modal.innerHTML = `
      <h3>Gerenciar perfis</h3>
      <p>Edite nomes e fotos. Você pode anexar uma imagem do seu computador.</p>
      <div class="profiles-edit-list"></div>
      <div style="display:flex;justify-content:space-between;margin-top:24px;align-items:center">
        <button class="btn add-profile">Adicionar perfil</button>
        <div class="profile-actions">
          <button class="btn cancel">Cancelar</button>
          <button class="btn primary save">Salvar</button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const list = modal.querySelector(".profiles-edit-list");

    function renderList() {
      list.innerHTML = "";
      profiles.forEach((p, i) => {
        const item = document.createElement("div");
        item.className = "profile-edit";
        item.innerHTML = `
          <img src="${p.img}" alt="${p.name}" />
          <input type="text" value="${p.name}" placeholder="Nome do perfil" style="max-width:175px" />
          <input type="file" accept="image/*" style="display:none" />
          <button class="btn change-photo" title="Alterar foto" style="background:transparent;border:none;cursor:pointer;padding:4px;display:flex;align-items:center">
            <img src="${assetPrefix}adicionarfoto.png" alt="Alterar foto" style="width:28px;height:28px;object-fit:contain;border:none;border-radius:0" />
          </button>
          <button class="btn remove" title="Excluir">Excluir</button>
        `;
        const imgEl = item.querySelector("img");
        const nameInput = item.querySelector('input[type="text"]');
        const fileInput = item.querySelector('input[type="file"]');
        const changePhotoBtn = item.querySelector(".change-photo");
        const removeBtn = item.querySelector(".remove");

        // Clique no botão da imagem abre o seletor de arquivo
        changePhotoBtn.addEventListener("click", () => fileInput.click());

        nameInput.addEventListener("input", () => {
          profiles[i].name = nameInput.value;
        });
        fileInput.addEventListener("change", (ev) => {
          const f = ev.target.files[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            profiles[i].img = e.target.result;
            imgEl.src = profiles[i].img;
          };
          reader.readAsDataURL(f);
        });

        removeBtn.addEventListener("click", () => {
          if (profiles.length <= 1)
            return alert("Ao menos um perfil deve existir.");
          profiles.splice(i, 1);
          if (activeIndex >= profiles.length) activeIndex = 0;
          renderList();
        });

        list.appendChild(item);
      });
    }

    renderList();

    modal.querySelector(".add-profile").addEventListener("click", () => {
      profiles.push({ name: "Novo", img: assetPrefix + "Convidado.jpg" });
      renderList();
    });
    modal.querySelector(".cancel").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", onKey, listenerOpts);
    function onKey(e) {
      if (e.key === "Escape") close();
    }

    modal.querySelector(".save").addEventListener("click", () => {
      renderMainProfiles();
      persist();
      applyActive(activeIndex, true);
      close();
    });

    function close() {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
    }
  }
}

if (!window.__MYFLIX_APP__) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initProfilesPage());
  } else {
    initProfilesPage();
  }
}
