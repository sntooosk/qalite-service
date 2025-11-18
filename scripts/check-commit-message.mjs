import fs from 'node:fs'

const COMMIT_PATTERN =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([^)]+\))?!?: .+/

const file = process.argv[2]
if (!file) {
  console.error('No commit message file provided.')
  process.exit(1)
}

const message = fs.readFileSync(file, 'utf8').trim()

if (!COMMIT_PATTERN.test(message)) {
  console.error('Invalid commit message. Please use Conventional Commits.')
  process.exit(1)
}
