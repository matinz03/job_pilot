# RTK - Rust Token Killer (Codex CLI)

**Mandatory**: Use RTK for every supported shell command in this repository.

**Usage**: Token-optimized CLI proxy for shell commands.

## Rule

Always prefix supported shell commands with `rtk`. Use a direct command only when RTK cannot execute that operation.

Examples:

```bash
rtk git status
rtk cargo test
rtk npm run build
rtk pytest -q
```

## Meta Commands

```bash
rtk gain            # Token savings analytics
rtk gain --history  # Recent command savings history
rtk proxy <cmd>     # Run raw command without filtering
```

## Verification

```bash
rtk --version
rtk gain
which rtk
```
