// Mobile sidebar: hamburger menu with slide-in drawer

import { MOBILE_BREAKPOINT } from "./layout";
import { createThemeToggleButton } from "./theme";

function openSidebar(sidebar: HTMLElement, overlay: HTMLElement): void {
  sidebar.classList.add("open");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeSidebar(sidebar: HTMLElement, overlay: HTMLElement): void {
  sidebar.classList.remove("open");
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

export function initSidebar(): void {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const closeBtn = document.getElementById("sidebarCloseBtn");
  const themeContainer = document.getElementById("sidebarThemeToggle");

  if (!hamburgerBtn || !sidebar || !overlay || !closeBtn) return;

  // Add theme toggle button into sidebar
  if (themeContainer) {
    themeContainer.appendChild(createThemeToggleButton());
  }

  hamburgerBtn.addEventListener("click", () => {
    openSidebar(sidebar, overlay);
  });

  closeBtn.addEventListener("click", () => {
    closeSidebar(sidebar, overlay);
  });

  overlay.addEventListener("click", () => {
    closeSidebar(sidebar, overlay);
  });

  // Close sidebar when a nav link is clicked
  const sidebarLinks = sidebar.querySelectorAll(".sidebar-link");
  for (const link of sidebarLinks) {
    link.addEventListener("click", () => {
      closeSidebar(sidebar, overlay);
    });
  }

  // Auto-close sidebar when switching to desktop width
  window
    .matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    .addEventListener("change", (e) => {
      if (!e.matches) {
        closeSidebar(sidebar, overlay);
      }
    });
}
