#
# merging into the main branch
#
git pull origin main
git checkout main
git merge rcz
git tag -a "2025-02-05" -m "Added biometric authentication"
git push origin main
git checkout rcz
