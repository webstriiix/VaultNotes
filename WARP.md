# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

VaultNotes is an AI-powered, decentralized note-taking application built on the Internet Computer Protocol (ICP). It features end-to-end encryption, collaborative editing, AI-powered summarization, and NFT minting capabilities.

**Tech Stack:**
- Backend: Rust canisters (WebAssembly) on Internet Computer
- Frontend: React 19 + Vite + TailwindCSS + HeroUI
- Authentication: Internet Identity (Web3)
- Encryption: vetKD protocol for client-side encryption
- AI: Custom on-chain summarization engine

## Development Commands

### Local Development Setup
```bash
# Start local Internet Computer replica
dfx start --clean --background

# Deploy all canisters
dfx canister create --all
dfx deploy

# Frontend development (with hot reload)
cd src/encrypted-notes-frontend
npm install
npm start
```

### Build Commands
```bash
# Build Rust backend
dfx build

# Generate Candid interfaces
dfx generate

# Build frontend
cd src/encrypted-notes-frontend
npm run build

# Full project build
npm run build
```

### Testing Commands
```bash
# Test AI health check
dfx canister call encrypted-notes-backend ai_health_check

# Test AI summarization
dfx canister call encrypted-notes-backend ai_summarize '(record { 
  text = "Your test content here..."; 
  content_type = opt "general" 
})'

# Run frontend tests
cd src/encrypted-notes-frontend
npm test

# Test specific functionality
node test-semantic-search.js
node verification.js
```

### Deploy Commands
```bash
# Deploy backend only
dfx deploy encrypted-notes-backend

# Deploy frontend only
dfx deploy encrypted-notes-frontend

# Deploy with specific identity
dfx deploy --identity <identity-name>
```

## Architecture

### Backend (Rust Canister)
**Location:** `src/encrypted-notes-backend/src/`

**Key Files:**
- `lib.rs` - Main canister logic with ckBTC integration and NFT operations
- `ai_service_new.rs` - Modular AI engine with clean public API
- `ai_endpoints.rs` - AI endpoint implementations with IC-CDK annotations
- `user.rs` - User management and profile operations
- `note.rs` - Note CRUD operations, sharing, and encryption
- `search.rs` - Search index management and operations
- `types.rs` - Core data structures (Note, UserProfile, Nft, SearchIndex)
- `storage.rs` - Stable memory management for persistence
- `helpers.rs` - Utility functions, constants, and common operations
- `ai/` - Modular AI implementation (types, analyzer, personalization, core)

**Core Features:**
- Encrypted note storage with sharing permissions (read/edit)
- AI-powered summarization with content type detection
- NFT minting from notes with ckBTC integration
- User profiles and collaboration
- Semantic search capabilities
- vetKD integration for threshold cryptography

### Frontend (React)
**Location:** `src/encrypted-notes-frontend/src/`

**Structure:**
- `components/` - Reusable UI components including AI features
- `pages/` - Application pages (Dashboard, Notes, Profile, Marketplace)
- `services/` - API services and AI integration
- `hooks/` - Custom React hooks (useAISummarizer, useSemanticSearch)

**Key Components:**
- AI-enhanced search with fallback mechanisms
- Real-time collaborative note editing
- Responsive design with HeroUI components
- Internet Identity integration

### AI Integration
The application features a custom on-chain AI engine that provides:
- Content analysis and type detection
- Text summarization (extractive and abstractive)
- Semantic search capabilities
- Language detection and sentiment analysis

**Performance Characteristics:**
- Processing time: <0.001s per summary
- Cycle cost: ~1K cycles per operation
- 23-37% optimal compression ratio
- Zero external dependencies

## File Structure Guidelines

**Configuration Files:**
- `dfx.json` - ICP deployment configuration with canister definitions
- `Cargo.toml` - Workspace configuration for Rust backend
- Frontend package management in `src/encrypted-notes-frontend/package.json`

**Development Files:**
- Candid interface: `src/encrypted-notes-backend/encrypted-notes-backend.did`
- Type definitions automatically generated with `dfx generate`
- Environment variables in `.env` (auto-generated)

**Documentation:**
- Technical docs in `docs/` directory
- Integration guides for AI features
- Deployment and troubleshooting guides

## Development Patterns

### Error Handling
- Backend uses Result types and proper error propagation
- Frontend has fallback mechanisms for AI features
- Comprehensive logging for debugging

### State Management
- Backend uses stable memory (ic-stable-structures)
- Frontend uses React hooks and context for state
- Encrypted data handled client-side before storage

### Security
- All user operations require non-anonymous principals
- Permission checks on note access (read/edit/owner)
- Client-side encryption with vetKD protocol
- ckBTC integration for payments without custody

### Testing Strategy
- Backend logic testable via dfx canister calls
- Frontend components use standard React testing
- AI features have comprehensive fallback testing
- Performance benchmarking for AI operations

## Common Development Tasks

### Adding New AI Features
1. Extend types in `ai_service.rs` for request/response structures
2. Implement core logic in AI service module
3. Add canister endpoint in `lib.rs` with proper authentication
4. Create React hook in `hooks/` for frontend integration
5. Add fallback mechanisms in `services/AIService.js`

### Note Operations
- Notes are encrypted client-side before storage
- Sharing requires explicit permission management
- All operations validate user permissions
- Support for collaborative editing with conflict resolution

### Canister Management
- Use `dfx canister status` to check canister health
- Cycle monitoring for production deployments
- Upgrade procedures maintain stable memory
- Identity management for different environments

## Environment Variables

The application auto-generates `.env` file with:
- Canister IDs for all deployed canisters
- Network configuration (local/IC mainnet)
- Frontend build variables

## Performance Considerations

- AI operations are optimized for sub-millisecond response
- Stable memory efficient for large note collections  
- Frontend lazy loads components and data
- Semantic search uses efficient similarity algorithms
- ckBTC operations include retry mechanisms for reliability

## Debugging

### Backend Issues
```bash
# Check canister logs
dfx canister logs encrypted-notes-backend

# Inspect canister state
dfx canister call encrypted-notes-backend whoami

# Verify AI functionality
dfx canister call encrypted-notes-backend ai_health_check
```

### Frontend Issues
- Browser dev tools for React debugging
- Network tab for canister communication
- Console logs for AI service fallbacks
- Local storage inspection for encrypted data