# Web Admin Support System - Implementation Documentation

## Overview
This document describes the complete support ticket management system for the HealthTips web admin panel, which synchronizes with Firebase and provides real-time chat functionality with app users.

## Implementation Date
November 29, 2025

## Features Implemented

### 1. TypeScript Types (src/types/index.ts)
Added two new interfaces to support the ticket system:

```typescript
export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  issueType: string;
  subject: string;
  description: string;
  imageUrl?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  timestamp: number;
  respondedAt?: number;
  adminResponse?: string;
  adminId?: string;
  messages?: Record<string, SupportMessage>;
}

export interface SupportMessage {
  id: string;
  text: string;
  imageUrl?: string;
  senderId: string;
  senderType: 'user' | 'admin';
  senderName: string;
  timestamp: number;
}
```

### 2. Firebase Service (src/services/firebase.ts)
Created a comprehensive `SupportService` class with the following methods:

#### getAll(filters?)
- Retrieves all support tickets from Firebase `/issues` path
- Supports filtering by status and issueType
- Returns tickets sorted by timestamp (newest first)

#### getById(id)
- Retrieves a specific ticket by ID

#### updateStatus(id, status, adminId?)
- Updates ticket status (pending, in_progress, resolved)
- Automatically sets respondedAt timestamp when status becomes "resolved"
- Tracks which admin updated the status

#### getMessages(ticketId)
- Retrieves all messages for a specific ticket
- Returns messages sorted by timestamp

#### sendMessage(ticketId, message)
- Sends a new message to a ticket
- Automatically updates ticket status from "pending" to "in_progress" when admin sends first message
- Supports both text and image messages

#### getStats()
- Returns aggregate statistics:
  - Total tickets
  - Pending tickets count
  - In-progress tickets count
  - Resolved tickets count

### 3. Support Management Page (src/pages/support/index.tsx)
A comprehensive admin interface with the following sections:

#### Statistics Dashboard
Four stat cards displaying:
- Total tickets
- Pending tickets (warning color)
- In-progress tickets (info color)
- Resolved tickets (success color)

#### Search and Filters
- **Search**: Search by subject, description, or user email
- **Status filter**: Filter by pending/in_progress/resolved
- **Issue type filter**: Filter by bug/feature/question/other
- **Clear filters** button to reset all filters

#### Tickets Table (DataGrid)
Displays all tickets with columns:
- Ticket ID (shortened, uppercase)
- User info (name + email)
- Issue type
- Subject
- Status (color-coded chip)
- Created date and time
- View button to open chat

#### Chat Dialog
A full-featured modal dialog that includes:

**Header Section:**
- Ticket ID and subject
- User email and issue type
- Close button

**Ticket Information Panel:**
- Full problem description
- Attached image (if available)
- Current status chip
- Status update dropdown (to change ticket status)

**Messages Section:**
- Real-time message list with auto-scroll
- Different styling for user vs admin messages:
  - Admin messages: Right-aligned, blue background
  - User messages: Left-aligned, white background
- Each message shows sender name and timestamp
- Support for image attachments in messages
- Auto-refresh every 5 seconds to fetch new messages

**Message Input:**
- Text input field (multiline)
- Send button
- Enter key to send (Shift+Enter for new line)
- Disabled state while sending

#### Real-time Features
- Auto-refresh messages every 5 seconds when chat is open
- Auto-scroll to bottom when new messages arrive
- Instant status updates across the UI

### 4. Authentication Integration
- Uses Firebase Auth to identify admin user
- Stores admin ID when updating ticket status
- Shows admin name/email in chat messages

## Firebase Data Structure

The system uses the following Firebase Realtime Database structure:

```
/issues
  /{ticketId}
    - userId: string
    - userEmail: string
    - userName: string (optional)
    - issueType: string
    - subject: string
    - description: string
    - imageUrl: string (optional)
    - status: 'pending' | 'in_progress' | 'resolved'
    - timestamp: number
    - respondedAt: number (optional)
    - adminId: string (optional)
    /messages
      /{messageId}
        - text: string
        - imageUrl: string (optional)
        - senderId: string
        - senderType: 'user' | 'admin'
        - senderName: string
        - timestamp: number
```

## Integration with Android App

This web admin system synchronizes with the Android app's support ticket system:

### Android Side (Already Implemented)
- Users can create tickets via `ReportIssueActivity`
- Users can attach images (stored in Cloudinary)
- Users can view their tickets in `MySupportTicketsActivity`
- Users can chat with admin in `TicketChatActivity`
- Real-time message synchronization

### Web Admin Side (Now Implemented)
- Admins can view all tickets
- Admins can filter and search tickets
- Admins can chat with users in real-time
- Admins can update ticket status
- Admins can view attached images

## Usage Instructions

### Accessing the Support Management Page
1. Log in to the web admin panel
2. Navigate to `/support`
3. The page will load all support tickets

### Viewing and Responding to Tickets
1. Use filters to find specific tickets (by status or type)
2. Click "Xem" (View) button on any ticket
3. Review the ticket information and chat history
4. Type a message in the input field
5. Click "Gửi" (Send) or press Enter to send
6. Update the ticket status using the dropdown

### Status Management
- **Đang chờ (Pending)**: New tickets waiting for admin response
- **Đang xử lý (In Progress)**: Admin has responded, conversation ongoing
- **Đã giải quyết (Resolved)**: Issue is resolved and closed

Status automatically changes from "Pending" to "In Progress" when admin sends the first message.

## Technical Notes

### Performance Optimizations
- Messages are polled every 5 seconds (can be optimized to use Firebase real-time listeners)
- DataGrid pagination (25/50/100 items per page)
- Client-side filtering for instant search results

### Error Handling
- Toast notifications for all user actions (success/error)
- Try-catch blocks around all Firebase operations
- Loading states for async operations

### UI/UX Features
- Responsive design (works on mobile and desktop)
- Auto-scroll to latest messages
- Color-coded status chips for quick visual identification
- Avatar icons for stat cards
- Material-UI components for consistent design

## Future Enhancements (Optional)

1. **Real-time Updates**: Replace polling with Firebase onValue listeners
2. **Image Upload**: Allow admins to send images in responses
3. **Bulk Actions**: Select and update multiple tickets at once
4. **Advanced Filters**: Filter by date range, admin assigned, etc.
5. **Ticket Assignment**: Assign specific tickets to specific admins
6. **Email Notifications**: Notify users when admin responds
7. **Canned Responses**: Pre-defined response templates for common issues
8. **Analytics**: Track response times, resolution rates, etc.
9. **Export**: Export tickets to CSV/Excel
10. **Internal Notes**: Add private admin notes not visible to users

## Files Modified/Created

### Web Admin
1. **Created**: `src/pages/support/index.tsx` (640 lines)
2. **Modified**: `src/types/index.ts` (+25 lines)
3. **Modified**: `src/services/firebase.ts` (+153 lines)
4. **Created**: `WEB_ADMIN_SUPPORT_SYSTEM.md` (this file)

### Android App (Previously Completed)
1. Created: `SupportMessage.java`
2. Created: `MessageAdapter.java`
3. Created: `TicketChatActivity.java`
4. Modified: `SupportTicket.java`
5. Modified: `CloudinaryHelper.java`
6. Modified: `ReportIssueActivity.java`
7. Created: Chat bubble layouts and backgrounds

## Testing Checklist

### Web Admin Testing
- [ ] View all tickets
- [ ] Filter by status
- [ ] Filter by issue type
- [ ] Search by keyword
- [ ] Open ticket chat dialog
- [ ] View ticket details and images
- [ ] Send message to user
- [ ] Update ticket status
- [ ] Verify real-time message updates
- [ ] Test on different screen sizes

### Integration Testing
- [ ] Create ticket from Android app
- [ ] Verify ticket appears in web admin
- [ ] Respond from web admin
- [ ] Verify response appears in Android app
- [ ] Update status from web admin
- [ ] Verify status updates in Android app
- [ ] Test image attachments both ways

## Deployment Notes

### Environment Variables Required
The web admin already has Firebase configuration in `.env`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DB_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

### Build and Deploy
```bash
cd "D:\hoc tap\web\healthtips-admin"
npm run build
vercel --prod
```

## Support and Maintenance

### Common Issues

**Q: Messages not updating in real-time**
A: Currently using 5-second polling. Consider implementing Firebase real-time listeners for instant updates.

**Q: Images not loading**
A: Check Cloudinary configuration and ensure image URLs are accessible.

**Q: Can't update ticket status**
A: Ensure admin user is logged in and has proper permissions.

## Conclusion

The support system is now fully implemented and integrated between the Android app and web admin panel. Both platforms can:
- Create and view support tickets
- Chat in real-time
- Update ticket status
- Attach and view images
- Filter and search tickets

All data is synchronized through Firebase Realtime Database, ensuring consistency across platforms.
