---
name: device-commands
description: List paired devices and run commands on them using built-in tools.
metadata: { "clawdbot": { "emoji": "🖥️" } }
---

# Device Commands

You have access to built-in tools for device management:

- **devices_list** - List all paired devices for the user
- **devices_run** - Run a command on a specific device (by name)
- **devices_job_status** - Check the status of a running command

## File Upload

To send a file from user's device via WhatsApp/messaging:

1. Use `devices_run` with command `upload:/path/to/file`
2. Parse the JSON result: `{"url": "http://...", "mimeType": "...", "sizeBytes": N}`
3. Use the `message` tool with `mediaUrl` parameter set to the returned URL

Example:

```
devices_run command="upload:~/Desktop/photo.jpg"
→ {"url": "http://localhost:3000/uploads/user123/abc.jpg", "mimeType": "image/jpeg", "sizeBytes": 12345}
message to="+1234567890" text="Here's your photo" mediaUrl="http://localhost:3000/uploads/user123/abc.jpg"
```

Use these tools directly when the user asks about their devices or wants to run commands on them.
