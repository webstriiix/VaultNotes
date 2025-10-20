# Unshare Feature - Visual Flow Diagram

## 🔄 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         NOTES PAGE                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Note Card                              │  │
│  │  ┌────────────────────────────────────────────┐          │  │
│  │  │ Title: My Important Note                   │  [⋮]    │  │
│  │  │ Content: Lorem ipsum dolor sit amet...     │          │  │
│  │  │ Tags: #work #project                       │          │  │
│  │  └────────────────────────────────────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ Click [⋮]
                             ▼
              ┌──────────────────────────┐
              │  Dropdown Menu           │
              ├──────────────────────────┤
              │  Edit                    │
              │  Share as Read Only      │───┐
              │  Share with Edit Access  │───┼──► TO SHARE MODALS
              │  Manage Shares      ⭐   │   │    (with unshare)
              │  Delete                  │   │
              └──────────────────────────┘   │
                             │               │
                             │ Click         │
                             ▼               ▼
```

## 📊 Component Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                            Notes.jsx                              │
│                         (Main Container)                          │
│                                                                   │
│  States:                                                          │
│  • isShareModalOpen                                               │
│  • isShareEditModalOpen                                           │
│  • isUnshareModalOpen  ⭐ NEW                                     │
│  • selectedNoteId                                                 │
│                                                                   │
│  Functions:                                                       │
│  • handleShareNote()                                              │
│  • handleShareEditNote()                                          │
│  • handleManageShares()  ⭐ NEW                                   │
│                                                                   │
└───────────────────┬───────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────────────┐
        │           │           │                   │
        ▼           ▼           ▼                   ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐
│ ShareRead    │ │ ShareEdit   │ │ Unshare      │ │ Delete      │
│ NoteModal    │ │ NoteModal   │ │ NoteModal⭐  │ │ NoteModal   │
│              │ │             │ │              │ │             │
│ Features:    │ │ Features:   │ │ Features:    │ │             │
│ • Show       │ │ • Show      │ │ • Show       │ │             │
│   existing   │ │   existing  │ │   edit users │ │             │
│   read users │ │   edit users│ │ • Show       │ │             │
│ • Add new    │ │ • Add new   │ │   read users │ │             │
│ • Unshare ⭐ │ │ • Unshare⭐ │ │ • Unshare⭐  │ │             │
└──────────────┘ └─────────────┘ └──────────────┘ └─────────────┘
```

## 🎯 Unshare Flow Diagram

```
                        ┌─────────────────┐
                        │  User clicks    │
                        │ "Manage Shares" │
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ UnshareNoteModal opens │
                    └────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Fetch note data via          │
              │ get_note(noteId)             │
              └──────────┬───────────────────┘
                         │
                         ▼
              ┌──────────────────────────────┐
              │ Fetch all users via          │
              │ get_other_users()            │
              └──────────┬───────────────────┘
                         │
                         ▼
              ┌──────────────────────────────┐
              │ Filter users into:           │
              │ • readOnlyUsers              │
              │ • editUsers                  │
              └──────────┬───────────────────┘
                         │
                         ▼
              ┌──────────────────────────────┐
              │ Display Modal with:          │
              │                              │
              │ Edit Access (2) 🟡          │
              │ [User A ❌] [User B ❌]      │
              │                              │
              │ Read Only (1) 🟢            │
              │ [User C ❌]                  │
              └──────────┬───────────────────┘
                         │
                         │ User clicks ❌
                         ▼
              ┌──────────────────────────────┐
              │ Call backend:                │
              │ • unshare_note_edit() OR     │
              │ • unshare_note_read()        │
              └──────────┬───────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
         ✅ Success        ❌ Error
                │                 │
                ▼                 ▼
    ┌───────────────────┐ ┌──────────────────┐
    │ Remove from list  │ │ Show error toast │
    │ Show success toast│ │                  │
    └───────────────────┘ └──────────────────┘
```

## 🔀 Share Modal with Unshare Flow

```
         ┌──────────────────────────────┐
         │ User opens Share Modal       │
         │ (Read or Edit)               │
         └──────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────────────────┐
         │ Fetch existing shared users  │
         │ from note data               │
         └──────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────────────────┐
         │ Display Modal:               │
         │                              │
         │ ┌──────────────────────────┐ │
         │ │ Currently Shared With:   │ │
         │ │ [User A ❌] [User B ❌] │ │ ◄── Can unshare here!
         │ └──────────────────────────┘ │
         │                              │
         │ ─────────────────────────    │
         │                              │
         │ ┌──────────────────────────┐ │
         │ │ Add New Users:           │ │
         │ │ [Search box...]          │ │
         │ │ [User list...]           │ │
         │ └──────────────────────────┘ │
         └──────────────────────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
    Click ❌           Click Save
      (unshare)        (share new)
          │                   │
          ▼                   ▼
```

## 🗂️ Data Structure

```javascript
// Note Structure (from backend)
{
  id: 123,
  owner: Principal,
  encrypted: "...",
  shared_read: [Principal1, Principal2],     // Read-only users
  shared_edit: [Principal3, Principal4]      // Edit users
}

// User Structure
{
  id: Principal,
  username: "john_doe",
  email: "john@example.com"
}

// Component State
{
  // UnshareNoteModal
  readOnlyUsers: [User1, User2],
  editUsers: [User3, User4],
  loading: false,
  
  // ShareReadNoteModal
  existingSharedUsers: [User1, User2],      // Already shared
  sharedUsers: [User5],                     // To be shared
  allUsers: [User1, User2, ..., User10],    // All available
  
  // ShareEditNoteModal
  existingSharedUsers: [User3, User4],      // Already shared
  sharedUsers: [User6],                     // To be shared
  allUsers: [User1, User2, ..., User10]     // All available
}
```

## 🎨 UI Color Scheme

```
┌─────────────────────────────────────────────┐
│  Chip Color Meanings                        │
├─────────────────────────────────────────────┤
│                                             │
│  🟡 YELLOW (Warning)                        │
│     → Edit Access                           │
│     → Full permissions                      │
│     → Used in UnshareNoteModal             │
│                                             │
│  🟢 GREEN (Success)                         │
│     → Read-only Access                      │
│     → View permissions only                 │
│     → Used in UnshareNoteModal             │
│                                             │
│  🔵 BLUE (Primary)                          │
│     → New users to add                      │
│     → Used in all Share Modals             │
│                                             │
└─────────────────────────────────────────────┘
```

## 🔐 Permission Matrix

```
┌─────────────────┬──────────┬──────────┬──────────┐
│                 │  Owner   │  Editor  │  Reader  │
├─────────────────┼──────────┼──────────┼──────────┤
│ Read Note       │    ✅    │    ✅    │    ✅    │
│ Edit Note       │    ✅    │    ✅    │    ❌    │
│ Delete Note     │    ✅    │    ❌    │    ❌    │
│ Share Note      │    ✅    │    ❌    │    ❌    │
│ Unshare Note    │    ✅    │    ❌    │    ❌    │
│ Manage Shares   │    ✅    │    ❌    │    ❌    │
└─────────────────┴──────────┴──────────┴──────────┘
```

## 📱 Responsive Layout

```
Desktop View (UnshareNoteModal):
┌─────────────────────────────────────────┐
│ 👥 Manage Shared Access            ❌   │
├─────────────────────────────────────────┤
│ Edit Access (3)                         │
│ [User A] [User B] [User C]              │
│ ─────────────────────────────────────   │
│ Read Only Access (2)                    │
│ [User D] [User E]                       │
├─────────────────────────────────────────┤
│                  [Close]                │
└─────────────────────────────────────────┘

Mobile View:
┌───────────────────────┐
│ 👥 Manage...     ❌   │
├───────────────────────┤
│ Edit Access (3)       │
│ [User A]              │
│ [User B]              │
│ [User C]              │
│ ──────────────────    │
│ Read Only (2)         │
│ [User D]              │
│ [User E]              │
├───────────────────────┤
│      [Close]          │
└───────────────────────┘
```

## 🎬 Animation Flow

```
Modal Opening:
  opacity: 0 → 1
  scale: 0.95 → 1
  backdrop: blur(0) → blur(8px)

Chip Removal (Unshare):
  1. User clicks ❌
  2. API call starts
  3. Chip fades out (opacity: 1 → 0)
  4. Chip slides left (translateX: 0 → -100%)
  5. Chip removed from DOM
  6. Toast appears (slide down)

Loading State:
  • Show spinner in modal center
  • Disable all interactions
  • Display: "Loading..."
```

---

**Visual Guide**: Unshare Feature  
**Created**: October 18, 2025  
**Purpose**: Help developers understand the feature architecture
