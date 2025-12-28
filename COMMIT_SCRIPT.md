# Git Commit Helper Script

This script helps you create well-formatted commits following [Conventional Commits](https://www.conventionalcommits.org/) standards.

## Usage

```bash
./commit.sh
```

The script will:
1. Check your current git status
2. Ask for the commit type (feat, fix, docs, etc.)
3. Optionally ask for a scope (web, api, socket, etc.)
4. Ask for the commit message
5. Show you the final commit message
6. Stage all changes and commit
7. Optionally push to remote

## Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring (no functional changes)
- **test**: Adding or updating tests
- **chore**: Other changes (build scripts, dependencies, etc.)

## Examples

- `feat(web): add loading spinners to API calls`
- `fix(api): resolve authentication token expiry issue`
- `docs: update README with setup instructions`
- `refactor(socket): simplify connection handler`

## Requirements

- Git installed and configured
- Bash shell
- Execute permission on the script (`chmod +x commit.sh`)
