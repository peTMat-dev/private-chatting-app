echo ".claude/" >> .gitignore
git add .gitignore
git rm -r --cached .claude
git commit -m "Stop tracking .claude"

git add -A
git commit -m "Stop tracking ignored files and update .gitignore"