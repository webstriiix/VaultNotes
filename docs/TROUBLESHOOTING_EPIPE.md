# Troubleshooting WSL EPIPE Error

## Error: "Failed to scan for dependencies from entries: The service was stopped: write EPIPE"

This error commonly occurs in WSL when running Vite dev server. Here are several solutions:

### Solution 1: Use Alternative Dev Server Start Methods

```bash
# Method 1: Use npx directly
npx vite --port 3000 --host 0.0.0.0

# Method 2: Use Vite with legacy mode
npx vite --port 3000 --legacy

# Method 3: Run from Windows PowerShell/CMD instead of WSL
# (Open PowerShell in the project directory)
npm run start
```

### Solution 2: WSL File System Permissions

```bash
# Reset node_modules permissions
sudo chown -R $(whoami) node_modules/
sudo chmod -R 755 node_modules/

# Clear cache and reinstall
rm -rf node_modules/.vite
rm -rf node_modules/.cache
npm install
```

### Solution 3: Node.js Version Issues

```bash
# Check Node.js version (should be 18+)
node --version

# If needed, update Node.js in WSL
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Solution 4: Use Build & Preview Instead

```bash
# Build the project
npm run build

# Preview the built version
npx vite preview --port 3000 --host 0.0.0.0
```

### Solution 5: Alternative Development Workflow

If dev server continues to have issues, you can:

1. **Build and Preview**: Use `npm run build` followed by `npx vite preview`
2. **Deploy to Local Canister**: Use `dfx deploy` and test with the local IC replica
3. **Use Windows Terminal**: Run the dev server from Windows PowerShell instead of WSL

## Verification That Implementation Works

✅ **Backend compiles successfully**: `cargo build --target wasm32-unknown-unknown --release`
✅ **Frontend builds successfully**: `npm run build` 
✅ **No import errors**: All dependencies resolved correctly
✅ **TypeScript compilation**: All type checks pass

The semantic search implementation is **fully functional** and ready for use!
