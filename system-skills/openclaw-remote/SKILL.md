---
name: openclaw-remote
description: Connect to and delegate tasks to remote OpenClaw instances.
metadata: { "clawdbot": { "emoji": "🔗" } }
---

# OpenClaw Remote

You have access to tools for connecting and delegating tasks to the user's remote OpenClaw instances:

- **openclaw_list** - List all connected OpenClaw instances for the user
- **openclaw_run** - Run a prompt or agent on a remote instance
- **openclaw_status** - Check the status of a remote instance
- **openclaw_sync** - Sync data between instances (agents, skills, memory)

## Use Cases

### 1. Local GPU Processing

If the user has a powerful local machine with GPU, you can delegate compute-heavy tasks there:

```
openclaw_run instance="My Desktop" prompt="Analyze this large dataset..."
```

### 2. Specialized Agents

Delegate to specialized agents running on different instances:

```
openclaw_run instance="Coding Server" agent="code-reviewer" prompt="Review this PR"
```

### 3. Hybrid Execution

Run quick tasks on Clawku servers, heavy tasks on user's hardware:

```
# Quick lookup - runs on Clawku
message text="The weather in Tokyo is..."

# Heavy analysis - runs on user's GPU server
openclaw_run instance="GPU Server" prompt="Generate detailed report from 10GB log files"
```

## Connection Setup

Users connect their OpenClaw instances via:

1. Dashboard → Settings → OpenClaw Connections
2. Add connection with gateway URL (e.g., `ws://localhost:18789`)
3. Provide authentication (password or token)
4. Test connection

## Instance Selection

When multiple instances are available:

- Use specific instance: `openclaw_run instance="My Desktop" ...`
- Use default: `openclaw_run ...` (uses user's default instance)
- List available: `openclaw_list` to see all instances with their status

## Status Monitoring

Check instance status before delegating important tasks:

```
openclaw_status instance="GPU Server"
→ { "status": "connected", "lastSeen": "2s ago", "capabilities": ["gpu", "large-context"] }
```

## Best Practices

1. **Check availability** before delegating time-sensitive tasks
2. **Use appropriate instance** based on task requirements
3. **Handle failures gracefully** - fall back to server execution if remote is unavailable
4. **Respect user preferences** - honor default instance settings
