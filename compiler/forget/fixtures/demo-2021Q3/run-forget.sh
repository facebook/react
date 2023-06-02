# this is so temporary otherwise we should use a makefile or at least a loop?

npx babel src/Feed.js --out-file src/Feed.forget.js

echo "import { useMemoCache } from \"./useMemoCache\"; \n$(cat src/Feed.forget.js)" > src/Feed.forget.js


npx babel src/Demo1.js --out-file src/Demo1.forget.js

echo "import { useMemoCache } from \"./useMemoCache\"; \n$(cat src/Demo1.forget.js)" > src/Demo1.forget.js

npx babel src/Demo2.js --out-file src/Demo2.forget.js

echo "import { useMemoCache } from \"./useMemoCache\"; \n$(cat src/Demo2.forget.js)" > src/Demo2.forget.js
