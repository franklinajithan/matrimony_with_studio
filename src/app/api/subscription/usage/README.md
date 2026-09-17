The read-only usage endpoint is informational. Protected actions must use the atomic consume RPC/API, not a read-then-write sequence. This avoids concurrent requests bypassing monthly limits.
