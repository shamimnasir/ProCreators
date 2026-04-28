#!/bin/bash
# Script to add credit system to all tools missing it

TOOLS_TO_FIX=(
  "activity-book"
  "business-plan"
  "checklist-maker"
  "citation-generator"
  "cover-letter"
  "email-campaigns"
  "essay-helper"
  "exam-prep"
  "how-to-guide"
  "interview-prep"
  "journal-maker"
  "landing-page-copy"
  "marketing-strategy"
  "networking-message"
  "notion-templates"
  "pitch-deck"
  "planner-maker"
  "professional-email"
  "quiz-maker"
  "resume-builder"
  "salary-negotiator"
  "slides-maker"
  "storybook-maker"
  "study-notes"
  "swot-analysis"
  "worksheet-maker"
  "youtube-creator"
)

echo "Tools needing credit integration: ${#TOOLS_TO_FIX[@]}"

for tool in "${TOOLS_TO_FIX[@]}"; do
  file="/app/app/api/${tool}/generate/route.js"
  if [ -f "$file" ]; then
    # Check if already has credits
    if ! grep -q "deductCredits\|checkCredits" "$file"; then
      echo "Needs fix: $tool"
    else
      echo "Already has credits: $tool"
    fi
  else
    echo "File not found: $file"
  fi
done
