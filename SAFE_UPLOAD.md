Safe upload checklist for GitHub

1) Verify local .gitignore contains:
   - .env
   - .hypothesis/
   - venv/
   - __pycache__/

2) Remove any tracked secret/test artifacts:
   ```bash
   git rm -r --cached bio-stock-api/.hypothesis || true
   git commit -m "Remove hypothesis artifacts from repo"
   ```

3) Do not commit `.env` with real secrets. Use `.env.example` only.

4) Run a local secret scan and audit:
   ```bash
   pip install detect-secrets
   detect-secrets scan > .secrets.baseline
   detect-secrets audit .secrets.baseline
   ```

5) If any secret was committed, purge it from history (backup first):
   ```bash
   # Backup a mirror
   git clone --mirror . ../repo-backup.git

   # Replace secrets using git-filter-repo
   pip install git-filter-repo
   # Create replacements.txt with lines of the form:
   # SECRET==>REMOVED
   git filter-repo --replace-text replacements.txt

   # Force-push to remote (after reviewing backup):
   git push --force
   ```

6) Create a private GitHub repository and push:
   ```bash
   gh repo create my-repo --private --source=. --remote=origin --push
   ```

7) Configure on GitHub:
   - Enable secret scanning and Dependabot alerts
   - Add runtime secrets in Settings → Secrets
   - Add branch protection rules (require PR reviews, CI checks)

8) Optional: enable automated scans (TruffleHog / detect-secrets) in CI.

Notes:
- If you want, I can attempt to detect secrets now and, with your OK, purge any found secrets from git history (I'll create a backup before destructive changes).