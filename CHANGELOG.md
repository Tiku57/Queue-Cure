# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-06-22
### Added
- Wait Time Engine 2.0 with dynamic real-time predictive calculation
- Smart Queue Intelligence banner detecting doctor speed vs rolling averages
- Priority Queue System (EMERGENCY overrides instantly)
- Multi-Clinic Tenancy (Socket Rooms and `clinicId` DB indexing)
- `/doctor` Dashboard workspace with consultation timers
- `/analytics` Dashboard with Recharts
- `/track/[id]` Patient QR Code mobile tracking
- Event Sourcing via `QueueEvent` log collection
- Offline Resilience Socket Polling fallback

### Changed
- Migrated to Next.js App Router
- Complete UI overhaul with Linear-style aesthetics and Framer Motion

### Removed
- Static wait time multiplier logic from V1
