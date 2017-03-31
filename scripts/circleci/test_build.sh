#!/bin/bash		
		
set -e		
		
npm run build -- --extractErrors
git checkout -- scripts/error-codes/codes.json		