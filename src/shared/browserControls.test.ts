import { describe, expect, it, vi } from 'vitest';

import { click, element, mediaQueries, mountApp } from '../__fixtures__/browser';

import { setupAccordionToggle } from './accordion';
import { setButtonActive } from './dom';
import { loadPersisted, savePersisted } from './persist';
import { createResetLink } from './resetLink';
import { initSidebar } from './sidebar';
import { createThemeToggleButton, initTheme } from './theme';

describe('browser persistence', () => {
  it('round-trips data and falls back for absent or corrupt values', () => {
    expect(loadPersisted('missing', { count: 1 })).toEqual({ count: 1 });
    savePersisted('x', { count: 2 });
    expect(localStorage.getItem('x')).toBe('{"count":2}');
    expect(loadPersisted('x', null)).toEqual({ count: 2 });
    const error = vi.spyOn(console, 'error').mockImplementation(vi.fn<() => void>());
    localStorage.setItem('x', 'broken');
    expect(loadPersisted('x', 3)).toBe(3);
    expect(error).toHaveBeenCalledWith(
      'Error loading "x" from localStorage:',
      expect.any(SyntaxError)
    );
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(() => {
        throw new Error('quota');
      }),
    });
    savePersisted('x', 'new');
    expect(error).toHaveBeenLastCalledWith('Error saving "x" to localStorage:', new Error('quota'));
  });
});

describe('theme and navigation controls', () => {
  it('follows system theme until the user chooses a persisted theme', () => {
    mountApp();
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect((element('meta[name="theme-color"]') as HTMLMetaElement).content).toBe('#667eea');
    const query = mediaQueries.get('(prefers-color-scheme: dark)');
    query?.dispatchEvent(Object.assign(new Event('change'), { matches: true }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect((element('meta[name="theme-color"]') as HTMLMetaElement).content).toBe('#1a1a2e');
    click('.theme-toggle');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    query?.dispatchEvent(Object.assign(new Event('change'), { matches: true }));
    expect(document.documentElement.dataset.theme).toBe('light');
    const button = createThemeToggleButton();
    expect(button.getAttribute('aria-label')).toBe('Toggle theme');
    button.click();
    expect(localStorage.getItem('theme')).toBe('dark');
  });
  it('shows both theme icons and restores the exact saved preference key', async () => {
    vi.resetModules();
    const theme = await import('./theme');
    mountApp();
    localStorage.setItem('theme', 'dark');
    theme.initTheme();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(element('.nav-container .theme-toggle').outerHTML).toMatchSnapshot();
    const query = mediaQueries.get('(prefers-color-scheme: dark)');
    expect(query?.media).toBe('(prefers-color-scheme: dark)');
    query?.dispatchEvent(Object.assign(new Event('change'), { matches: false }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
  it('loads saved preference and works without optional containers', () => {
    localStorage.setItem('theme', 'dark');
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('dark');
    localStorage.setItem('theme', 'invalid');
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
  it('opens and closes the mobile drawer and restores scrolling', () => {
    mountApp();
    initSidebar();
    click('#hamburgerBtn');
    expect(element('#sidebar').classList.contains('open')).toBe(true);
    expect(element('#sidebarOverlay').classList.contains('open')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    click('#sidebarCloseBtn');
    expect(document.body.style.overflow).toBe('');
    click('#hamburgerBtn');
    click('#sidebarOverlay');
    expect(element('#sidebar').classList.contains('open')).toBe(false);
    click('#hamburgerBtn');
    click('.sidebar-link');
    expect(element('#sidebar').classList.contains('open')).toBe(false);
    click('#hamburgerBtn');
    const query = mediaQueries.get('(max-width: 767px)');
    query?.dispatchEvent(Object.assign(new Event('change'), { matches: true }));
    expect(element('#sidebar').classList.contains('open')).toBe(true);
    query?.dispatchEvent(Object.assign(new Event('change'), { matches: false }));
    expect(element('#sidebar').classList.contains('open')).toBe(false);
    expect(element('#sidebarThemeToggle .theme-toggle').innerHTML).toContain('icon-moon');
  });
  it('toggles disclosures, active buttons and reset links without requiring absent controls', () => {
    document.body.innerHTML =
      '<div id="wrapper"><button id="toggle">Settings</button></div><button id="outside">Outside</button>';
    setupAccordionToggle('toggle');
    setupAccordionToggle('absent');
    click('#toggle');
    expect(element('#wrapper').classList.contains('expanded')).toBe(true);
    click('#toggle');
    expect(element('#wrapper').classList.contains('expanded')).toBe(false);
    click('#toggle');
    click('#outside');
    expect(element('#wrapper').classList.contains('expanded')).toBe(false);
    setButtonActive('toggle', true);
    expect(element('#toggle').classList.contains('active')).toBe(true);
    setButtonActive('toggle', false);
    setButtonActive('absent', true);
    expect(element('#toggle').classList.contains('active')).toBe(false);
    const reset = vi.fn();
    const button = createResetLink(reset);
    expect([button.type, button.className, button.textContent]).toEqual([
      'button',
      'reset-link',
      'Reset',
    ]);
    button.click();
    expect(reset).toHaveBeenCalledOnce();
    document.body.replaceChildren();
    initSidebar();
    expect(document.body.children).toHaveLength(0);
  });
});
