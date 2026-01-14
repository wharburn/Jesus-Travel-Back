#!/bin/bash

echo "Adding files to git..."
git add backend/src/models/Enquiry.js
git add backend/src/controllers/enquiryController.js  
git add test-disposal-ai-estimate.sh
git add AT_DISPOSAL_AI_ESTIMATE_FIX.md

echo ""
echo "Committing changes..."
git commit -m "Fix At Disposal AI estimate calculation"

echo ""
echo "Pushing to origin main..."
git push origin main

echo ""
echo "Done!"

