# Admin capabilities

See [ADMIN_SECTION_STATUS.md](ADMIN_SECTION_STATUS.md) for the current implemented scope, validation, migration order and release boundaries.

| Capability | Super Admin | Support | Moderator |
| --- | --- | --- | --- |
| Workspace and aggregate overview | Yes | Yes | Yes |
| Member directory, profile assistance, connections | Yes | Yes | Investigation read only |
| Private member notes | Yes | Yes | Yes |
| Reports, suspension and profile-review decisions | Yes | No | Yes |
| Story and profile-content moderation | Yes | No | Yes |
| Individual in-app member notices | Yes | Yes | No |
| Trial/promo controls, subscription records and plans | Yes | No | No |
| Staff assignment and security/audit explorer | Yes | No | No |

Every privileged mutation checks the live database permission and records its action atomically. Staff assignments do not change the legacy full-admin flag. Paid checkout, refunds and live payment collection remain disabled pending the separate billing integration.
