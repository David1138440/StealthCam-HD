# Security Specification - StealthCam HD

## Data Invariants
1. A user profile (`/users/{userId}`) can only be created or updated by the authenticated user whose `uid` matches `{userId}`.
2. A recording metadata (`/recordings/{recordingId}`) must have a `userId` field matching the `uid` of the authenticated creator.
3. Recording metadata is private to the owner.

## The "Dirty Dozen" Payloads
1. Create user profile with someone else's UID.
2. Update someone else's user profile email.
3. Create recording metadata with a fake `userId`.
4. Read recording metadata belonging to another user.
5. Update recording `userId` to transfer ownership.
6. Delete recording metadata belonging to another user.
7. Inject huge string (1MB) into recording title.
8. Create user profile without being logged in.
9. List all users (blanket read).
10. List all recordings (blanket read).
11. Spoof `admin` role (if implemented).
12. Modify `createdAt` field on update.

## Test Runner Logic
Verified in `firestore.rules` using `isValidUser` and `isValidRecording` helpers and strict identity checks.
