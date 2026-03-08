# Navbar Improvements Documentation

## Overview

The navbar has been redesigned to be fully responsive with different UX patterns for desktop and mobile devices.

## Desktop Navbar (md breakpoint and above)

**Features:**

- Fixed top navigation bar
- Horizontal layout with logo on left
- Centered navigation links (Home, Schedule, Anime, About)
- Right-side actions: Notifications, Theme selector, User menu (Admin/Logout)
- All elements are visible and accessible

**Layout:**

```
[GotArchive] [Home] [Schedule] [Anime] [About] ... [Notifications] [Theme] [Admin] [Logout]
```

## Mobile Navbar (below md breakpoint)

**Features:**

1. **Top Bar** (56px height)
   - Logo on the left
   - Notification bell and theme selector on the right
   - Minimal, clean design

2. **Bottom Dock** (64px height)
   - Fixed at bottom of screen
   - Contains 4 essential navigation items:
     - Home
     - Schedule
     - Anime
     - About
   - Active route is highlighted
   - Uses DaisyUI's `btm-nav` component

3. **FAB Menu** (Floating Action Button)
   - Positioned bottom-right, above the dock
   - Opens additional menu items:
     - Admin (if logged in)
     - Logout (if logged in)
     - Theme selector
   - Items animate in with staggered effect
   - Overlay backdrop when open

## Components Created

### 1. `MobileDock.svelte`

Bottom navigation dock for mobile devices.

**Props:**

```typescript
interface DockItem {
  route: string;
  icon: typeof Icon;
  label: string;
}

items: DockItem[]
```

**Usage:**

```svelte
<MobileDock items={[
  { route: '/', icon: Home, label: 'Home' },
  { route: '/schedule', icon: Calendar, label: 'Schedule' }
]} />
```

### 2. `MobileMenu.svelte`

FAB (Floating Action Button) menu for additional actions.

**Props:**

```typescript
interface MenuItem {
  label: string;
  action: () => void;
  icon?: any;
}

items: MenuItem[]
```

**Usage:**

```svelte
<MobileMenu items={[
  { label: 'Settings', action: () => {}, icon: Settings },
  { label: 'Logout', action: () => signOut(), icon: LogOut }
]} />
```

## Responsive Breakpoints

- **Mobile**: `< 768px (md breakpoint)`
  - Shows: Top bar + Bottom dock + FAB menu
  - Hides: Desktop navbar

- **Desktop**: `>= 768px (md breakpoint)`
  - Shows: Full desktop navbar
  - Hides: Bottom dock + FAB menu

## Integration with Notification Center

The notification center is integrated into both mobile and desktop navbars:

- **Desktop**: Notification button in top-right area
- **Mobile**: Notification button in top-right of mobile bar
- Both show unread count badge
- Clicking opens the notification drawer
- Popups appear in top-left corner

## Spacing & Design

Following the design philosophy:

- **Minimal spacing**: Using `gap-2`, `p-2` (8px) throughout
- **Mobile-first**: Designed for 384px minimum width (iPhone SE)
- **Clean layout**: Ample whitespace, not cluttered
- **Consistent**: Same visual style across mobile and desktop

## Bottom Spacing

- **Mobile**: `mb-20` on main content to account for bottom dock (80px)
- **Desktop**: `mb-2` for normal spacing
- Footer remains accessible on both views

## Z-Index Layers

- `z-50`: Top navbar (desktop & mobile)
- `z-50`: FAB menu button
- `z-40`: Dock, notification drawer, FAB overlay
- `z-30`: Main content

## Testing

Test at these breakpoints:

- **384px**: iPhone SE (smallest supported)
- **768px**: Tablet (breakpoint transition)
- **1024px**: Desktop
- **1920px**: Large desktop

## Future Enhancements

Potential improvements:

- Swipe gestures to open notification drawer
- Haptic feedback on mobile interactions
- PWA installation prompt in mobile menu
- Quick actions in FAB menu
- Customizable dock items per user
