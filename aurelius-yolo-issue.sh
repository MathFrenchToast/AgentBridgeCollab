#!/bin/bash

# --- Configuration Globale ---
export GEMINI_YOLO=true
export GEMINI_NON_INTERACTIVE=true
LOG_FILE="aurelius_yolo.log"
TIMEOUT_LIMIT="30m"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 1. Préparation de l'environnement
ISSUE_NUM=$1
if [ -z "$ISSUE_NUM" ]; then
    # Récupération des données de l'issue
    log "Récupération de l'issue #$ISSUE_NUM via GitHub CLI..."
    ISSUE_DATA=$(gh issue view "$ISSUE_NUM" --json title,body)
    ISSUE_BODY=$(echo "$ISSUE_DATA" | jq -r '.body')
    BRANCH_NAME="fix/issue-$ISSUE_NUM"
    FIRST_GEMINI_CMD="/aurelius:analyze issue: $ISSUE_NUM body: $ISSUE_BODY"
elif
   FIRST_GEMINI_CMD="Quels sont les prochaines actions (tu peux décider que la prochaine action te concerne) ?"
fi


# Setup Git
log "Préparation de la branche $BRANCH_NAME..."
git checkout develop && git pull
git checkout -b "$BRANCH_NAME" || git checkout "$BRANCH_NAME"

# --- Fonction d'exécution avec gestion Timeout & Resume ---
execute_gemini() {
    local cmd="$1"
    local output="last_run.tmp"
    
    log "Lancement : $cmd"
    
    # Exécution avec timeout
    timeout $TIMEOUT_LIMIT gemini "$cmd" > "$output" 2>&1
    local status=$?

    # Gestion du Timeout (124 = code retour de 'timeout')
    if [ $status -eq 124 ]; then
        log "TIMEOUT atteint ($TIMEOUT_LIMIT). Tentative de reprise (resume)..."
        # Le resume reprend la session 'latest' par défaut
        gemini --resume "Le temps est écoulé, termine l'action en cours." > "$output" 2>&1
    fi

    cat "$output" >> "$LOG_FILE"
}

# 2. PHASE D'ANALYSE (Modèle Pro Forcé)
log ">>> PHASE 1 : ANALYSE (Modèle : gemini-3.1-pro-preview)"
export GEMINI_MODEL="gemini-3.1-pro-preview"

execute_gemini $FIRST_GEMINI_CMD

# 3. BOUCLE DE TRAVAIL (Modèle en sélection AUTO)
log ">>> PHASE 2 : EXÉCUTION (Modèle : Auto-selection)"
# On désactive le forçage du modèle pour laisser le CLI décider
unset GEMINI_MODEL 

# Extraction du premier NEXT_STEP
NEXT_STEP=$(grep "\[NEXT_STEP\]:" last_run.tmp | cut -d':' -f2- | tr -d ' "')

while [[ -n "$NEXT_STEP" ]]; do
    log "Action suivante détectée : $NEXT_STEP"
    
    # Appel de la commande (on préfixe par / si c'est une commande aurelius)
    if [[ $NEXT_STEP == aurelius:* ]]; then
        execute_gemini "/$NEXT_STEP"
    else
        execute_gemini "$NEXT_STEP"
    fi

    # Recherche du prochain step dans la nouvelle sortie
    NEXT_STEP=$(grep "\[NEXT_STEP\]:" last_run.tmp | cut -d':' -f2- | tr -d ' "')
    
    # Sécurité : si la sortie est identique pour éviter les boucles infinies
    # (Optionnel : ajouter un compteur d'itérations ici si nécessaire)
done

log "Workflow terminé pour l'issue #$ISSUE_NUM sur la branche $BRANCH_NAME."