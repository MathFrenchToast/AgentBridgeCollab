#!/bin/bash

# --- Configuration Globale ---
export GEMINI_YOLO=true
# export GEMINI_NON_INTERACTIVE=true # Désactivé pour favoriser le streaming
DEFAULT_BRANCH="main"
LOG_FILE="aurelius_yolo.log"
TIMEOUT_LIMIT="0" # 0 for no timeout

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# --- Fonction d'exécution avec gestion Timeout & Resume ---
execute_gemini() {
    local cmd="$1"
    local output="last_run.tmp"
    local status=0
    
    # Instruction de rappel systématique pour le workflow
    local suffix="Termine IMPÉRATIVEMENT ta réponse par [NEXT_STEP]: <commande> ou [NEXT_STEP]: NONE"
    
    # On évite de doubler le suffixe si déjà présent
    if [[ ! "$cmd" == *"$suffix"* ]]; then
        cmd="$cmd. $suffix"
    fi

    log "Lancement : $cmd"
    
    if [ "$TIMEOUT_LIMIT" = "0" ]; then
        gemini --raw-output --accept-raw-output-risk --prompt "$cmd" 2>&1 | tee "$output"
        status=${PIPESTATUS[0]}
    else
        timeout $TIMEOUT_LIMIT stdbuf -i0 -oL -eL gemini --raw-output --accept-raw-output-risk --prompt "$cmd" 2>&1 | tee "$output"
        status=${PIPESTATUS[0]}

        if [ $status -eq 124 ]; then
            log "TIMEOUT atteint ($TIMEOUT_LIMIT). Reprise..."
            gemini --raw-output --accept-raw-output-risk --resume "Le temps est écoulé, termine l'action en cours avec le marqueur [NEXT_STEP]." 2>&1 | tee "$output"
            status=${PIPESTATUS[0]}
        fi
    fi

    cat "$output" >> "$LOG_FILE"
    return $status
}

# 1. Préparation de l'environnement
ISSUE_NUM=$1
if [ -n "$ISSUE_NUM" ]; then
    # Récupération des données de l'issue
    log "Récupération de l'issue #$ISSUE_NUM via GitHub CLI..."
    ISSUE_DATA=$(gh issue view "$ISSUE_NUM" --json title,body)
    ISSUE_BODY=$(echo "$ISSUE_DATA" | jq -r '.body')
    BRANCH_NAME="fix/issue-$ISSUE_NUM"
    FIRST_GEMINI_CMD="/aurelius:analyze issue: $ISSUE_NUM body: $ISSUE_BODY"
    # Setup Git
    log "Préparation de la branche $BRANCH_NAME..."
    git checkout $DEFAULT_BRANCH && git pull
    git checkout -b "$BRANCH_NAME" || git checkout "$BRANCH_NAME"

else
   # Utilisation de la commande analyze par défaut pour activer les skills et le [NEXT_STEP]
   FIRST_GEMINI_CMD="/aurelius:analyze Quelles sont les prochaines actions (tu peux décider que la prochaine action te concerne) ?"
fi


# 2. PHASE D'ANALYSE (Utilisation du modèle par défaut)
log ">>> PHASE 1 : ANALYSE"
# export GEMINI_MODEL="gemini-3.1-pro-preview" # Désactivé pour éviter les problèmes de quota

execute_gemini "$FIRST_GEMINI_CMD" || { log "Échec de la phase d'analyse."; exit 1; }

# 3. BOUCLE DE TRAVAIL (Modèle en sélection AUTO)
log ">>> PHASE 2 : EXÉCUTION (Modèle : Auto-selection)"
unset GEMINI_MODEL 

# Extraction du premier NEXT_STEP
NEXT_STEP=$(grep "\[NEXT_STEP\]:" last_run.tmp | tail -n 1 | cut -d':' -f2- | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

while [[ -n "$NEXT_STEP" ]]; do
    if [[ "$NEXT_STEP" == "NONE" ]]; then
        log "Tâche terminée (NONE). Demande de relance à l'analyseur..."
        # On demande une relance via analyze
        execute_gemini "/aurelius:analyze D'après ce qui vient d'être fait, quelle est la toute prochaine action concrète à entreprendre ? Réponds impérativement par [NEXT_STEP]: <commande> ou [NEXT_STEP]: NONE si vraiment tout est fini."
        
        # On vérifie si l'analyseur confirme la fin
        NEXT_STEP=$(grep "\[NEXT_STEP\]:" last_run.tmp | tail -n 1 | cut -d':' -f2- | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
        if [[ "$NEXT_STEP" == "NONE" ]]; then
            log "L'analyseur confirme que tout est terminé. Fin du workflow."
            break
        fi
        continue # On repart dans la boucle avec la nouvelle action
    fi

    log "Action suivante détectée : $NEXT_STEP"
    
    # Appel de la commande (on préfixe par / si c'est une commande aurelius)
    if [[ $NEXT_STEP == aurelius:* ]]; then
        execute_gemini "/$NEXT_STEP"
    else
        execute_gemini "$NEXT_STEP"
    fi

    # Recherche du prochain step dans la nouvelle sortie (on prend la dernière occurrence)
    NEXT_STEP=$(grep "\[NEXT_STEP\]:" last_run.tmp | tail -n 1 | cut -d':' -f2- | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
done

log "Workflow terminé pour l'issue #$ISSUE_NUM sur la branche $BRANCH_NAME."