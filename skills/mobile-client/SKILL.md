---
name: mobile-client
description: Enables enhanced mobile app interactions for Clawku mobile clients.
homepage: https://clawku.ai
metadata:
  {
    "openclaw":
      {
        "emoji": "📱",
        "category": "integration",
        "requires": {},
        "tools": [
          {
            "name": "mobile_push_notification",
            "description": "Send a push notification to the user's mobile device",
            "parameters": {
              "type": "object",
              "properties": {
                "title": { "type": "string", "description": "Notification title" },
                "body": { "type": "string", "description": "Notification body" },
                "data": { "type": "object", "description": "Optional data payload" }
              },
              "required": ["title", "body"]
            }
          },
          {
            "name": "mobile_request_media",
            "description": "Request the user to take a photo or select an image",
            "parameters": {
              "type": "object",
              "properties": {
                "type": { "type": "string", "enum": ["camera", "gallery", "both"], "description": "Media source type" },
                "prompt": { "type": "string", "description": "Message to show the user" }
              },
              "required": ["type"]
            }
          },
          {
            "name": "mobile_request_voice",
            "description": "Request voice input from the user (speech-to-text)",
            "parameters": {
              "type": "object",
              "properties": {
                "prompt": { "type": "string", "description": "Message to show before recording" },
                "maxDuration": { "type": "number", "description": "Max recording duration in seconds" }
              }
            }
          },
          {
            "name": "mobile_show_action_sheet",
            "description": "Show an action sheet with selectable options",
            "parameters": {
              "type": "object",
              "properties": {
                "title": { "type": "string", "description": "Action sheet title" },
                "options": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": { "type": "string" },
                      "label": { "type": "string" },
                      "destructive": { "type": "boolean" }
                    },
                    "required": ["id", "label"]
                  },
                  "description": "List of options"
                }
              },
              "required": ["title", "options"]
            }
          },
          {
            "name": "mobile_haptic_feedback",
            "description": "Trigger haptic feedback on the device",
            "parameters": {
              "type": "object",
              "properties": {
                "type": { "type": "string", "enum": ["light", "medium", "heavy", "success", "warning", "error"], "description": "Feedback type" }
              },
              "required": ["type"]
            }
          }
        ]
      }
  }
---

# mobile-client

The `mobile-client` skill enables enhanced interactions for users connecting via the Clawku mobile app.

## Capabilities

When a user is connected from the Clawku mobile app, you can use these additional tools:

### Push Notifications
Send push notifications to the user's device even when the app is in the background:
```
mobile_push_notification(title: "Reminder", body: "Don't forget your meeting!")
```

### Request Media
Ask the user to capture or select images:
```
mobile_request_media(type: "camera", prompt: "Please take a photo of the document")
mobile_request_media(type: "gallery", prompt: "Select an image to analyze")
```

### Voice Input
Request speech-to-text input:
```
mobile_request_voice(prompt: "Speak your message", maxDuration: 30)
```

### Action Sheets
Present options to the user:
```
mobile_show_action_sheet(
  title: "What would you like to do?",
  options: [
    { id: "photo", label: "Take a photo" },
    { id: "file", label: "Upload a file" },
    { id: "cancel", label: "Cancel", destructive: false }
  ]
)
```

### Haptic Feedback
Provide tactile feedback:
```
mobile_haptic_feedback(type: "success")
mobile_haptic_feedback(type: "warning")
```

## Context

When a mobile client connects, the system prompt includes:
- Device type (iOS/Android)
- App version
- Device capabilities (camera, microphone permissions)

This allows you to tailor responses and suggest appropriate actions.

## Best Practices

1. **Keep responses concise** - Mobile screens are smaller
2. **Use action sheets** for multiple choices instead of long text lists
3. **Request media** when visual input would help
4. **Use haptic feedback** sparingly for important interactions
5. **Push notifications** only for time-sensitive or important updates
