#!/bin/bash

# --- Configuration via Environnement ---
export GEMINI_MODEL="gemini-3.1-pro-preview"
export GEMINI_YOLO=true
export GEMINI_NON_INTERACTIVE=true
# export GEMINI_SESSION="latest" # Optionnel car par défaut sur resume

LOG_FILE="aurelius_flow.log"
TIMEOUT="30m"

log() {
    echo "[$(date +'%T')] $1" | tee -a "$LOG_FILE"
}

# 1. Préparation Issue & Git
ISSUE_NUM=$1
[ -z "$ISSUE_NUM" ] && { echo "Usage: $0 <issue_number>"; exit 1; }

log "Analyse de l'issue #$ISSUE_NUM..."
ISSUE_DATA=$(gh issue view "$ISSUE_NUM" --json title,body)
ISSUE_BODY=$(echo "$ISSUE_DATA" | jq -r '.body')
BRANCH_NAME="fix/issue-$ISSUE_NUM"

git checkout develop && git pull
git checkout -b "$BRANCH_NAME" || git checkout "$BRANCH_NAME"

# 2. Fonction d'exécution robuste
execute_gemini() {
    local cmd="$1"
    local attempt=$2
    local out="last_run.tmp"

    log "Run: $cmd (Attempt $attempt)"
    
    # On utilise 'timeout' pour surveiller le process
    timeout $TIMEOUT gemini "$cmd" > "$out" 2>&1
    local status=$?

    if [ $status -eq 124 ]; then
        if [ $attempt -eq 1 ]; then
            log "Timeout! Tentative de reprise..."
            execute_gemini "--resume \"Le temps est écoulé, termine ton analyse précédente.\"" 2
        else
            log "Échec critique : Second timeout sur resume."
            exit 1
        fi
    fi
    
    cat "$out" >> "$LOG_FILE"
    return 0
}

# 3. Chaînage des actions
# Premier appel : Analyze
execute_gemini "/aurelius:analyze issue: $ISSUE_NUM body: $ISSUE_BODY" 1

# Extraction du NEXT_STEP
NEXT_STEP=$(grep "\[NEXT_STEP\]:" last_run.tmp | cut -d':' -f2- | tr -d ' "')

if [[ $NEXT_STEP == aurelius:* ]]; then
    log "Action suivante détectée : $NEXT_STEP"
    # On lance l'action suivante (dev-ticket, groom-ticket, etc.)
    # Note : Le modèle passera en auto-sélection si on ne force pas GEMINI_MODEL ici
    execute_gemini "/$NEXT_STEP" 1
else
    log "Fin de cycle : Pas de [NEXT_STEP] exploitable."
fi

log "Workflow terminé sur $BRANCH_NAME"