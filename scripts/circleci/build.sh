#!/bin/bash		
		
set -e		
		
npm run build -- --extract-errors
git checkout -- scripts/error-codes/codes.json		