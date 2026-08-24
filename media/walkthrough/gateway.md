The optional gateway is for Claude Code, Cursor, and other compatible MCP
clients. It is disabled by default and requires Workspace Trust plus explicit
consent.

The gateway binds to loopback, uses a rotating bearer credential, limits every
instance to one workspace, and asks for detail-specific approval before
returning implementation detail. It governs only requests made through its own
MCP tools; it cannot disable an agent's separate filesystem or terminal tools.
