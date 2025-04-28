# DevOps Permission Explorer

A tool to test Azure DevOps Personal Access Token (PAT) permissions and understand the exposed attack surface when a PAT is discovered.

## Purpose

This tool helps security professionals and administrators to:

- Validate the scope of access for discovered Azure DevOps PATs
- Audit permissions across projects and APIs
- Understand potential security risks from exposed tokens

## Prerequisites

- [Bun](https://bun.sh/) runtime

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/devops-perm-explorer.git
cd devops-perm-explorer
```

2. Install dependencies:

```bash
bun install
```

## Configuration

1. Open `devops-perm-explorer.ts`
2. Set the following constants:

```typescript
const AZURE_DEVOPS_PAT = "your-pat-here";
const AZURE_DEVOPS_BASE_URL = "https://dev.azure.com/yourorgname";
```

## Usage

Run the tool:

```bash
bun run devops-perm-explorer.ts
```

The tool will test access to:

- Project listing
- Git repositories
- Teams
- Build definitions
- Release definitions
- Pipelines
- Variable groups
- Service endpoints

Results will be displayed with checkmarks (✅) for successful access and crosses (❌) for denied access.

## Sample Output

```
Azure DevOps PAT Permission Test Results:
----------------------------------------
✅ _apis/projects?api-version=7.0
    ├── Project1
    ├── Project2
    └── Project3
❌ _apis/git/repositories?api-version=7.0 (HTTP 403)
✅ _apis/teams?api-version=7.0&$top=100
```

## Security Notice

This tool should only be used for legitimate security testing with proper authorization. Unauthorized testing of PATs may violate terms of service and security policies.
