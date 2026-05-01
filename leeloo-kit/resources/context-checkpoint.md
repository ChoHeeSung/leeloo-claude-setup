# Context Checkpoint Rules

To prevent loss of work context during context compaction (PreCompact), record key decisions and findings to disk.

## Rules

- **File**: `.leeloo/context-summary.md`
- **When to record**: at major decisions, direction shifts, and key findings (NOT every turn)
- **Format**: one entry per line, `- [decision|finding|change] content` (≤100 chars)
- **Limit**: 20 lines maximum. Beyond that, drop the oldest entries first.
- **Automation**: Injected as postContext on PreCompact → merged into a session file and reset on SessionEnd.

## Examples

```
- [decision] Use raw SQL instead of ORM — performance is the priority
- [finding] Missing deleted_at index on user table — soft-delete query is slow
- [change] API response format snake_case → camelCase — frontend request
```

## Do not record

- Facts already obvious from the code (e.g., which file you edited)
- Anything already in the commit message or TODO
- Plain progress updates (TODO already covers that)
