# Keeper Desktop

Keeper Desktop is a a secure, cross-platform desktop app for using hardhaware wallets with the Bitcoin Keeper mobile app.

## Getting Started

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/bithyve/keeper-desktop.git
   cd keeper-desktop
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development build:
   ```
   npm run tauri dev
   ```

### Building for Production

To create a production build:

```
npm run tauri build
```

## Viewing Log Output

To see log output while running the app:

### On Unix-like systems (macOS, Linux):

```bash
RUST_LOG=info npm run tauri dev
```

### On Windows Command Prompt:

```cmd
set RUST_LOG=info && npm run tauri dev
```

### On Windows PowerShell:

```powershell
$env:RUST_LOG="info"; npm run tauri dev
```

You can adjust the log level by changing `info` to `debug`, `warn`, or `error` as needed.

Log messages will appear in the terminal where you run the command.