import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MoreHorizontal, Plus, Route as RouteIcon, Search } from 'lucide-react';
import clsx from 'clsx';
import { useReminders } from '../../api/queries.js';
import { useIsMobile } from '../../hooks/useMediaQuery.js';
import { useHotkey } from '../../hooks/useHotkey.js';
import { Button, IconButton, Modal } from '../ui/index.js';
import { ThemeToggle } from './ThemeToggle.jsx';
import { HypeToggle } from '../../features/hype/HypeToggle.jsx';
import { DemoBanner } from '../../demo/DemoBanner.jsx';
import { CommandPalette } from './CommandPalette.jsx';
import { ApplicationFormModal } from '../../features/applications/ApplicationFormModal.jsx';
import { NAV_ITEMS, MOBILE_PRIMARY, MOBILE_SECONDARY } from './navigation.js';
import styles from './AppShell.module.css';

export function AppShell() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: reminders } = useReminders();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useHotkey('k', () => setPaletteOpen(true), { meta: true, allowInInput: true });
  useHotkey('n', () => setAddOpen(true));

  const dueCount = (reminders?.counts.overdue ?? 0) + (reminders?.counts.today ?? 0);
  const active = NAV_ITEMS.find((item) =>
    (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)));
  const pageTitle = active?.title ?? 'Trail';

  const tabItems = [
    ...NAV_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.to)),
    ...NAV_ITEMS.filter((i) => MOBILE_SECONDARY.includes(i.to)),
  ];
  const moreItems = NAV_ITEMS.filter(
    (i) => !MOBILE_PRIMARY.includes(i.to) && !MOBILE_SECONDARY.includes(i.to),
  );

  return (
    <div className={styles.shell}>
      {!isMobile && (
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <div className={styles.mark}><RouteIcon size={17} strokeWidth={2.3} /></div>
            <div>
              <div className={styles.brandName}>Trail</div>
              <div className={styles.brandSub}>Job tracker</div>
            </div>
          </div>

          <Button variant="primary" icon={Plus} className={styles.addButton} onClick={() => setAddOpen(true)}>
            Add application
          </Button>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
              >
                <item.icon size={17} strokeWidth={1.9} aria-hidden />
                <span className={styles.navLabel}>{item.label}</span>
                {item.to === '/' && dueCount > 0 && <span className={styles.navBadge}>{dueCount}</span>}
              </NavLink>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.themeRow}>
              <span className={styles.themeLabel}>Appearance</span>
              <ThemeToggle />
            </div>
            <div className={styles.themeRow}>
              <span className={styles.themeLabel}>Hype</span>
              <HypeToggle />
            </div>
          </div>
        </aside>
      )}

      <div className={styles.main}>
        <DemoBanner />
        {isMobile ? (
          <header className={styles.mobileTopbar}>
            <h1 className={styles.mobileTitle}>{pageTitle}</h1>
            <div className={styles.topbarSpacer} />
            <IconButton label="Search" icon={Search} onClick={() => setPaletteOpen(true)} />
            <HypeToggle />
            <ThemeToggle />
          </header>
        ) : (
          <header className={styles.topbar}>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
            <div className={styles.topbarSpacer} />
            <button type="button" className={styles.searchTrigger} onClick={() => setPaletteOpen(true)}>
              <Search size={15} aria-hidden />
              Search
              <kbd className={styles.kbd}>⌘K</kbd>
            </button>
          </header>
        )}

        <main className={clsx(styles.content, location.pathname === '/board' && styles.contentWide)}>
          <Outlet />
        </main>
      </div>

      {isMobile && (
        <nav className={styles.tabbar}>
          {tabItems.map((item) => {
            const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <button
                key={item.to}
                type="button"
                className={clsx(styles.tab, isActive && styles.tabActive)}
                onClick={() => navigate(item.to)}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
                {item.to === '/' && dueCount > 0 && <span className={styles.tabDot} />}
                {item.label}
              </button>
            );
          })}

          <button type="button" className={clsx(styles.tab, styles.tabAdd)} onClick={() => setAddOpen(true)}>
            <span className={styles.tabAddMark}><Plus size={20} strokeWidth={2.4} /></span>
          </button>

          <button
            type="button"
            className={clsx(styles.tab, moreItems.some((i) => location.pathname.startsWith(i.to)) && styles.tabActive)}
            onClick={() => setMoreOpen(true)}
          >
            <MoreHorizontal size={20} strokeWidth={1.9} aria-hidden />
            More
          </button>
        </nav>
      )}

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Go to">
        <div className={styles.moreSheet}>
          {moreItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) => clsx(styles.moreItem, isActive && styles.moreItemActive)}
            >
              <item.icon size={19} strokeWidth={1.8} aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </div>
      </Modal>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ApplicationFormModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
